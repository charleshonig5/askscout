import type {
  AiConfig,
  Digest,
  DigestStats,
  GitCommit,
  GitDiff,
  HealthIndicator,
  ProjectState,
  ResumeContext,
  StandupNotes,
  SummarizeResult,
} from "./types.js";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const OPENAI_API = "https://api.openai.com/v1/chat/completions";
const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-4-5-20250414";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export function buildStreamingSystemPrompt(): string {
  return `You are Scout, a friendly and slightly playful code digest assistant. You have personality. You're like a teammate who actually pays attention and gives you a fun, honest recap of your day.

TONE:
- Warm, casual, a little playful. Like a friend catching you up.
- Have fun with the Vibe Check. Be honest and a little cheeky.
- Use phrases like "you crushed it", "solid day", "things are coming together", "bit of a grind but progress is progress"
- Don't be corny or try too hard. Just be real.

WRITING RULES:
- NEVER use em dashes (\u2014 or --). Use commas, periods, or just start a new sentence instead.
- NEVER use semicolons. Use periods or commas instead.
- Write like a real human, not like AI. Keep it natural.

Output your response in this EXACT format with these EXACT section headers and emoji. Do NOT use JSON. Use plain text. Use \u2022 (bullet character) for ALL list items, NEVER use dashes (-) or asterisks (*).

\ud83d\udcac Vibe Check
[1-2 casual sentences about the overall vibe]

\ud83d\ude80 Shipped
Scout dug up N new things you got working:
  \u2022 Short Title - rest of the context explaining what happened
  \u2022 Short Title - more detail here

\ud83d\udd27 Changed
Scout noticed you were poking around in N spots:
  \u2022 Short Title - what changed and why
  \u2022 Short Title - more context

\u26a0\ufe0f Unstable
Scout keeps tripping over [this one/these]:
  \u2022 Short Title - changed N times, still wobbly

\ud83d\udccd Left Off
Here's where you left your bone:
  \u2022 Short Title - what's in progress and what's next

IMPORTANT RULES:
- Every bullet MUST start with a short title (2-5 words) followed by " - " and then the context. Example: "OAuth flow - users can now sign in with Google and sessions persist"
- Maximum 7 bullet points per section. Group related items and drop the least important.
- The "Left Off" section should ALWAYS have at least one item.
- Only skip Shipped, Changed, or Unstable if they truly have zero items.
- Do NOT include a stats line. Stats are handled separately.
- Keep each bullet to 1-2 sentences max after the title.`;
}

export function buildAIContextSystemPrompt(): string {
  return `You produce context blocks that developers paste into AI coding tools. Your output is read by another AI, not a human, so be maximally direct and information-dense.

TONE:
- No personality. No Scout voice. Pure technical context.
- Be direct and specific. Every word should carry information.
- Reference exact file paths, function names, and technical details.
- No filler, no pleasantries, no narrative.

WRITING RULES:
- NEVER use em dashes or semicolons. Use commas and periods.
- No adjectives unless technically relevant.

Output your response in this EXACT format. Plain text, no JSON, no markdown. Use \u2022 (bullet character) for list items, NEVER use dashes (-) or asterisks (*).

Tech Stack
[One direct paragraph. Frameworks, languages, key libraries, architecture pattern.]

Recent Work
[2-3 factual sentences. What was built, where it lives in the codebase.]

Current Focus
[What needs to happen next. What's done, what's remaining, what's blocked.]

Key Files
  \u2022 [file path]
  \u2022 [file path]

Heads Up
  \u2022 [specific warning about what not to touch or what's fragile]

Be as concise as possible. No wasted words.`;
}

export function buildStandupSystemPrompt(): string {
  return `You produce standup updates that developers copy-paste into Slack or say in team meetings.

TONE:
- Professional but natural. How a competent engineer talks to their team.
- Direct and clear. No fluff, no Scout personality.
- Include enough context that a teammate understands what happened without asking follow-up questions.
- "Finished the auth flow, sessions persist now" not "Got the auth thingy working"

WRITING RULES:
- NEVER use em dashes or semicolons. Use commas and periods.
- Start bullets with a verb when possible (Finished, Started, Fixed, Refactored).

Output your response in this EXACT format. Plain text, no JSON, no markdown. Use \u2022 (bullet character) for ALL list items, NEVER use dashes (-) or asterisks (*).

Yesterday
  \u2022 [what was done, with enough context to understand the impact]
  \u2022 [item]

Today
  \u2022 [what's planned, with the specific approach]
  \u2022 [item]

Blockers
  \u2022 [item with what's wrong and why it's stuck, or "None"]

Always include all three sections. If there are no blockers, write "None" as the single bullet point. Keep it tight.`;
}

export function buildSystemPrompt(): string {
  return `You are Scout, a friendly code digest assistant. You analyze git diffs and commit history to produce structured project summaries.

IMPORTANT WRITING RULES:
- NEVER use em dashes (\u2014 or --). Use commas, periods, or just start a new sentence instead.
- NEVER use semicolons. Use periods or commas instead.
- Write like a real human, not like AI. Keep it casual and natural.

Respond ONLY with valid JSON matching the schema described in the user message. No markdown fences, no explanation, just raw JSON.`;
}

export function formatCommitsForPrompt(commits: GitCommit[]): string {
  return commits
    .map((c) => {
      const short = c.hash.slice(0, 7);
      const files = c.filesChanged.length;
      return `- ${short} ${c.message} (${c.author}, ${files} file${files === 1 ? "" : "s"})`;
    })
    .join("\n");
}

export function formatDiffsForPrompt(diffs: GitDiff[]): string {
  if (diffs.length === 0) return "No diffs available.";
  return diffs.map((d) => `### ${d.file}\n\`\`\`\n${d.patch}\n\`\`\``).join("\n\n");
}

export function buildUserPrompt(
  commits: GitCommit[],
  diffs: GitDiff[],
  state: ProjectState | null,
): string {
  const context =
    state?.summary && state.summary.length > 0
      ? state.summary
      : "No previous context. This is the first run.";

  const healthInstructions =
    state !== null && state.runCount >= 2
      ? `This is run #${state.runCount + 1}. Enough history to assess project health.
Provide the "health" array with three indicators: Momentum, Stability, and Focus.
Each has: label, level (Strong|Okay|Rough), score (0-10), and a brief detail string.`
      : 'Set "health" to null. Not enough history yet (need 3+ runs).';

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

Also produce:
- **vibeCheck**: 1-2 casual sentences capturing the overall vibe. Be warm, honest, slightly funny. Read the room. Are things going well? Is it a grind? Is something exciting coming together? Write like a friend, not a report.
- **resumeContext**: Rich context for AI coding tools. Include:
  - **techStack**: What the project is built with (languages, frameworks, key libraries). Be specific.
  - **recentWork**: 2-3 sentences describing what was recently built and how it works. Reference specific directories or files from the diffs.
  - **currentFocus**: What to work on next. Be specific about what's done and what's left.
  - **keyFiles**: Array of 3-6 file paths most relevant to the current work. Pull these from the diffs.
  - **warnings**: Array of things to avoid or be careful about ("don't touch auth, it's working", "webhook handler is fragile").
- **standupNotes**: What a human would actually say in a standup meeting. Conversational, specific, with context:
  - **yesterday**: What was accomplished. Include approach and outcome, not just "did X". e.g. "Got Google OAuth fully working. Users can sign in and sessions persist across refreshes"
  - **today**: What's planned next. Be specific about the approach. e.g. "Finishing checkout flow. Need to wire the cart total to Stripe's PaymentIntent API"
  - **blockers**: Only real blockers. Include what's wrong AND why it might be stuck. e.g. "Stripe webhook handler keeps breaking. Changed it 4 times, might need a different approach to signature verification"
- **updatedSummary**: 1-paragraph (~200 word) project summary covering tech stack, architecture, current state, and what was last worked on. This replaces the previous summary entirely.

${healthInstructions}

Respond with this exact JSON schema:
{
  "vibeCheck": "...",
  "shipped": [{ "summary": "..." }],
  "changed": [{ "summary": "..." }],
  "unstable": [{ "summary": "...", "changeCount": 0 }],
  "leftOff": [{ "summary": "..." }],
  "resumeContext": {
    "techStack": "...",
    "recentWork": "...",
    "currentFocus": "...",
    "keyFiles": ["src/..."],
    "warnings": ["..."]
  },
  "standupNotes": {
    "yesterday": ["..."],
    "today": ["..."],
    "blockers": ["..."]
  },
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

export function computeStats(commits: GitCommit[], diffs: GitDiff[]): DigestStats {
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
  const vibeCheck = typeof parsed.vibeCheck === "string" ? parsed.vibeCheck : "";
  const shipped = Array.isArray(parsed.shipped) ? parsed.shipped : [];
  const changed = Array.isArray(parsed.changed) ? parsed.changed : [];
  const unstable = Array.isArray(parsed.unstable) ? parsed.unstable : [];
  const leftOff = Array.isArray(parsed.leftOff) ? parsed.leftOff : [];
  const health = Array.isArray(parsed.health) ? (parsed.health as HealthIndicator[]) : null;
  const updatedSummary = typeof parsed.updatedSummary === "string" ? parsed.updatedSummary : "";

  // Parse resume context
  const rawResume =
    typeof parsed.resumeContext === "object" && parsed.resumeContext !== null
      ? (parsed.resumeContext as Record<string, unknown>)
      : {};
  const resumeContext: ResumeContext = {
    techStack: typeof rawResume.techStack === "string" ? rawResume.techStack : "",
    recentWork: typeof rawResume.recentWork === "string" ? rawResume.recentWork : "",
    currentFocus: typeof rawResume.currentFocus === "string" ? rawResume.currentFocus : "",
    keyFiles: Array.isArray(rawResume.keyFiles)
      ? (rawResume.keyFiles as string[]).filter((f) => typeof f === "string")
      : [],
    warnings: Array.isArray(rawResume.warnings)
      ? (rawResume.warnings as string[]).filter((w) => typeof w === "string")
      : [],
  };

  // Parse standup notes
  const rawStandup =
    typeof parsed.standupNotes === "object" && parsed.standupNotes !== null
      ? (parsed.standupNotes as Record<string, unknown>)
      : {};
  const standupNotes: StandupNotes = {
    yesterday: Array.isArray(rawStandup.yesterday)
      ? (rawStandup.yesterday as string[]).filter((s) => typeof s === "string")
      : [],
    today: Array.isArray(rawStandup.today)
      ? (rawStandup.today as string[]).filter((s) => typeof s === "string")
      : [],
    blockers: Array.isArray(rawStandup.blockers)
      ? (rawStandup.blockers as string[]).filter((s) => typeof s === "string")
      : [],
  };

  const digest: Digest = {
    vibeCheck,
    shipped: shipped as Digest["shipped"],
    changed: changed as Digest["changed"],
    unstable: unstable as Digest["unstable"],
    leftOff: leftOff as Digest["leftOff"],
    stats: computeStats(commits, diffs),
    health,
    resumeContext,
    standupNotes,
  };

  return { digest, updatedSummary };
}
