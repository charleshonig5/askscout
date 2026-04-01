import type {
  AiConfig,
  Digest,
  DigestStats,
  GitCommit,
  GitDiff,
  HealthIndicator,
  ProjectState,
  SummarizeResult,
} from "./types.js";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const OPENAI_API = "https://api.openai.com/v1/chat/completions";
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20250414";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

function buildSystemPrompt(): string {
  return `You are Scout, a friendly code digest assistant. You analyze git diffs and commit history to produce structured project summaries.

Respond ONLY with valid JSON matching the schema described in the user message. No markdown fences, no explanation, just raw JSON.`;
}

function formatCommitsForPrompt(commits: GitCommit[]): string {
  return commits
    .map((c) => {
      const short = c.hash.slice(0, 7);
      const files = c.filesChanged.length;
      return `- ${short} ${c.message} (${c.author}, ${files} file${files === 1 ? "" : "s"})`;
    })
    .join("\n");
}

function formatDiffsForPrompt(diffs: GitDiff[]): string {
  if (diffs.length === 0) return "No diffs available.";
  return diffs.map((d) => `### ${d.file}\n\`\`\`\n${d.patch}\n\`\`\``).join("\n\n");
}

function buildUserPrompt(
  commits: GitCommit[],
  diffs: GitDiff[],
  state: ProjectState | null,
): string {
  const context =
    state?.summary && state.summary.length > 0
      ? state.summary
      : "No previous context — this is the first run.";

  const healthInstructions =
    state !== null && state.runCount >= 2
      ? `This is run #${state.runCount + 1}. Enough history to assess project health.
Provide the "health" array with three indicators: Momentum, Stability, and Focus.
Each has: label, level (Strong|Okay|Rough), score (0-10), and a brief detail string.`
      : 'Set "health" to null — not enough history yet (need 3+ runs).';

  return `Analyze the following git activity and produce a structured digest.

## Previous Project Context
${context}

## Recent Commits (${commits.length} total)
${formatCommitsForPrompt(commits)}

## Diffs
${formatDiffsForPrompt(diffs)}

## Instructions
Categorize changes into these sections:
- **shipped**: New features or functionality that went from not existing to working.
- **changed**: Existing things that were modified, updated, or refactored.
- **unstable**: Files or features changed many times, reverted, or reworked. Include a changeCount (integer).
- **leftOff**: What was being actively worked on at the end. Half-finished work. What needs attention next.

Summarize at the **feature level**, not the file level. Use plain English.

Also produce an "updatedSummary" — a 1-paragraph (~200 word) project summary covering tech stack, architecture, current state, and what was last worked on. This replaces the previous summary entirely.

${healthInstructions}

Respond with this exact JSON schema:
{
  "shipped": [{ "summary": "..." }],
  "changed": [{ "summary": "..." }],
  "unstable": [{ "summary": "...", "changeCount": 0 }],
  "leftOff": [{ "summary": "..." }],
  "updatedSummary": "...",
  "health": null
}`;
}

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  ai: AiConfig,
): Promise<string> {
  const model = ai.model ?? DEFAULT_ANTHROPIC_MODEL;
  const response = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ai.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const body = await response.text().catch(() => "(could not read response body)");
    throw new Error(`Anthropic API error (${status}): ${body.slice(0, 200)}`);
  }

  const json = (await response.json()) as { content?: { text?: string }[] };
  const text = json.content?.[0]?.text;
  if (typeof text !== "string") {
    throw new Error("Anthropic API returned an unexpected response structure.");
  }
  return text;
}

async function callOpenAI(systemPrompt: string, userPrompt: string, ai: AiConfig): Promise<string> {
  const model = ai.model ?? DEFAULT_OPENAI_MODEL;
  const response = await fetch(OPENAI_API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ai.apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const status = response.status;
    const body = await response.text().catch(() => "(could not read response body)");
    throw new Error(`OpenAI API error (${status}): ${body.slice(0, 200)}`);
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = json.choices?.[0]?.message?.content;
  if (typeof text !== "string") {
    throw new Error("OpenAI API returned an unexpected response structure.");
  }
  return text;
}

function computeStats(commits: GitCommit[], diffs: GitDiff[]): DigestStats {
  const now = new Date();
  let from = now;
  let to = now;

  if (commits.length > 0) {
    const timestamps = commits.map((c) => c.timestamp.getTime());
    from = new Date(Math.min(...timestamps));
    to = new Date(Math.max(...timestamps));
  }

  return {
    commits: commits.length,
    filesChanged: new Set(diffs.map((d) => d.file)).size,
    linesAdded: diffs.reduce((sum, d) => sum + d.additions, 0),
    linesRemoved: diffs.reduce((sum, d) => sum + d.deletions, 0),
    timeSpan: { from, to },
  };
}

/** Send git data to the LLM and return a structured digest */
export async function summarize(
  commits: GitCommit[],
  diffs: GitDiff[],
  state: ProjectState | null,
  ai: AiConfig,
): Promise<SummarizeResult> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(commits, diffs, state);

  const rawText =
    ai.provider === "anthropic"
      ? await callAnthropic(systemPrompt, userPrompt, ai)
      : await callOpenAI(systemPrompt, userPrompt, ai);

  let raw: unknown;
  try {
    raw = JSON.parse(rawText) as unknown;
  } catch {
    throw new Error(
      `Failed to parse LLM response as JSON. Raw response:\n${rawText.slice(0, 500)}`,
    );
  }

  const parsed = raw as Record<string, unknown>;
  const shipped = Array.isArray(parsed.shipped) ? parsed.shipped : [];
  const changed = Array.isArray(parsed.changed) ? parsed.changed : [];
  const unstable = Array.isArray(parsed.unstable) ? parsed.unstable : [];
  const leftOff = Array.isArray(parsed.leftOff) ? parsed.leftOff : [];
  const health = Array.isArray(parsed.health) ? (parsed.health as HealthIndicator[]) : null;
  const updatedSummary = typeof parsed.updatedSummary === "string" ? parsed.updatedSummary : "";

  const digest: Digest = {
    shipped: shipped as Digest["shipped"],
    changed: changed as Digest["changed"],
    unstable: unstable as Digest["unstable"],
    leftOff: leftOff as Digest["leftOff"],
    stats: computeStats(commits, diffs),
    health,
  };

  return { digest, updatedSummary };
}
