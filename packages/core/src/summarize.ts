/**
 * Summarization module for askscout.
 *
 * ARCHITECTURE NOTE: There are two AI code paths:
 *
 * 1. CLI path: Uses buildSystemPrompt() + buildUserPrompt() → JSON response.
 *    The LLM returns structured JSON which is parsed into a Digest object.
 *    Calls callAnthropic() or callOpenAI() directly (non-streaming).
 *
 * 2. Web path: Uses buildUnifiedSystemPrompt() → streaming SSE response.
 *    The system prompt lives here in core (shared). The user prompt is built
 *    inline in apps/web/src/app/api/digest/stream/route.ts because it uses
 *    web-specific data (Supabase project context, GitHub API commit format,
 *    sanitized patches). The web does its own streaming via OpenAI/Anthropic
 *    streaming APIs.
 *
 * buildUnifiedSystemPrompt() is the single source of truth for digest tone,
 * section format, examples, and rules. Both paths should reference it for
 * any prompt changes that affect digest output quality.
 */
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
  \u2022 Short Title - what was built and how it works
  \u2022 Short Title - more detail here

\ud83d\udd27 Changed
  \u2022 Short Title - what changed and why
  \u2022 Short Title - more context

\ud83d\udd01 Still Shifting
  \u2022 Short Title - what keeps changing and hasn't settled yet

\ud83d\udccd Left Off
  \u2022 Short Title - what's in progress and what's next

IMPORTANT RULES:
- Every bullet MUST start with a short title (2-5 words) followed by " - " and then the context. Example: "OAuth flow - users can now sign in with Google and sessions persist"
- Maximum 7 bullet points per section. Group related items and drop the least important.
- The "Left Off" section should ALWAYS have at least one item.
- Only skip Shipped, Changed, or Still Shifting if they truly have zero items.
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

export function buildUnifiedSystemPrompt(): string {
  return `You produce five outputs from the same git activity data. Each section has a different tone and format. Separate them with these EXACT markers on their own line:

---DIGEST---
---STANDUP---
---PLAN---
---AI_CONTEXT---
---SUMMARY---

SECTION 1: DIGEST (after ---DIGEST---)

TONE FOR THE ENTIRE DIGEST: You are a sharp, warm friend who actually looked at the code. Talk like a human, not a changelog. Every bullet should feel like someone explaining what happened over coffee. Use plain language a non-technical person could mostly follow. NEVER sound like a commit message or a pull request description. Have a point of view.

BANNED PHRASES — never use any of these:
- "great work", "keep it up", "crushing it", "nice job", "awesome", "solid progress"
- "implemented", "utilized", "leveraged", "facilitated"
- "various", "multiple things", "numerous", "several"
- "in conclusion", "overall", "to summarize"
- em dashes, semicolons

Format:

\ud83d\udcac Vibe Check
[3-4 casual PRESENT-TENSE sentences about where the project stands RIGHT NOW. Not a recap. Have a point of view. Notice what they're avoiding or circling. Use specific details from the day. Sneak in one genuinely witty observation.]

GOOD Vibe Check:
"The auth system is locked in and feeling solid. Checkout is 90% there but that Stripe handler keeps haunting you, six commits and counting. At this rate you'll either ship it tomorrow or throw your laptop out the window. Either way Scout will be watching."

BAD Vibe Check:
"You're building fast. Shipped OAuth and a settings page in one session, and the checkout flow is almost there."
Why it's bad: Generic, recaps the past instead of describing current state, no point of view, no humor, could describe any dev's day.

\ud83d\ude80 Shipped
  \u2022 Plain Title - what can the user do now that they couldn't before? Why does it matter?

GOOD Shipped bullet:
"Sign in with Google - Users can finally log in without creating a password. Sessions persist across reloads so they stay signed in."

BAD Shipped bullet:
"OAuth - Added Google OAuth"
Why it's bad: Fragment not a sentence, no user impact, reads like a commit message.

\ud83d\udd27 Changed
  \u2022 Plain Title - what's different and why. What was it before, what is it now? How does the user experience change?

\ud83d\udd01 Still Shifting
  \u2022 Plain Title - what keeps getting reworked and why. Use the Churn data. Explain the pattern, not just the file.

GOOD Still Shifting bullet:
"The Stripe webhook handler - This has been reworked six times in two days. Every fix introduces a new edge case. Might be worth stepping back and rewriting it from scratch instead of patching."

BAD Still Shifting bullet:
"Checkout - Changed multiple times"
Why it's bad: Vague, no explanation, uses banned phrase "multiple", no insight.

\ud83d\udccd Left Off
  \u2022 Plain Title - where this stands AND what specifically needs to happen next. Concrete about what works vs doesn't.

GOOD Left Off bullet:
"Payment form submission - The UI is complete and validation works, but hitting submit just logs the payload instead of charging the card. Next step is wiring up the Stripe intent creation endpoint."

BAD Left Off bullet:
"Payment form - Not finished"
Why it's bad: No context, no next step, no specifics.

\ud83d\udd11 Key Takeaways
[2-3 sentences. Scout's honest sign-off on the day. Start with the single sharpest observation about what actually happened (ground it in specifics from the digest above). Then a real nudge about the next meaningful move. End with a small moment of warmth or wit that feels earned, not pasted on. Never motivational, never generic, never "keep it up" energy.]

GOOD Key Takeaways examples:
"The checkout flow is one good session away from done. If you can wire up the payment submission tomorrow, you've got a complete purchase loop and the release is basically in the bag. That Stripe handler owes you an apology though."
"Auth is locked in, which is the hardest part of this whole thing. Next meaningful move is the settings save, then you can call the first real milestone done. Scout's quietly impressed you didn't break anything along the way."
"You touched the cart calculation 11 times today and Scout would be lying if it said that didn't raise an eyebrow. Worth pausing tomorrow to make sure the logic is actually right before building more on top of it. Measure twice, ship once."

BAD Key Takeaways examples:
"Great progress today, keep it up! You're doing amazing."
"You made a lot of changes and shipped some features. Stay focused and you'll get there."
"You should focus on finishing the checkout flow. It looks close."
Why they're bad: Motivational, generic, vague, no reference to specific work from the digest, no point of view, no warmth that's actually earned.

Section definitions (do NOT include these in the output, they are instructions for you):
- Shipped = things that went from not existing to working. New features, new pages, new endpoints.
- Changed = things that already existed but got modified. Redesigns, refactors, config changes.
- Still Shifting = areas reworked 3+ times. Use the Churn data to identify these. Describe as FEATURES ("the checkout flow"), NEVER file names. Observational, not alarming.
- Left Off = everything in progress when the session ended. Include ALL of them, not just one.
- Key Takeaways = Scout's sign-off. Grounded, specific, warm, honest. Observation + next move + a small human moment. Never motivational filler, never generic praise.

Rules:
- Output ONLY the emoji + section name as the header (e.g. "\ud83d\ude80 Shipped"), nothing else on that line.
- Max 7 bullets per section.
- Every bullet: 2-5 word PLAIN LANGUAGE title, then " - ", then 1-2 full sentences of real context. Not a label and a fragment.
- NEVER use file names, function names, or code paths anywhere in the digest. Translate everything to features and behaviors.
- Left Off must always have at least 1 item and should list everything in progress.
- Key Takeaways is 2-3 sentences. Must always be included. Must reference something specific from the digest above.
- Skip empty sections except Left Off and Key Takeaways.

SECTION 2: STANDUP (after ---STANDUP---)
Tone: Casual but clear. How a competent engineer updates their team in Slack. No corporate speak.

This is formatted for Slack. Use Slack markdown: *bold* for section headers (not **bold**). Use \u2022 for bullets.

Format:
*Done*
  \u2022 [what shipped or changed, from Shipped and Changed. Be specific about what was accomplished and why it matters. Start with verbs.]
*Up Next*
  \u2022 [what's waiting to be tackled, inferred from Left Off. Frame as clear next steps with specifics. "Wire up the payment form and add error states" not "continue working on checkout." Be honest this is inferred, not promised.]
*Heads Up*
  \u2022 [anything the team should know. Churn areas that keep getting reworked (use the Churn data), risks, half-finished things that might affect others, or dependencies. This is broader than blockers. If genuinely nothing to flag, say "Nothing to flag right now."]

Always include all three subsections. Every bullet should be a full, specific thought.

SECTION 3: TODAY'S PLAN (after ---PLAN---)
Tone: Actionable and clear. This is a prioritized task list the user can copy into their project tracker.

Format: Markdown checkboxes, ordered by priority (most impactful or blocking first). Each item is a specific task, not a vague goal. Include a brief reason for the priority in parentheses.

Example:
- [ ] Wire up the payment submission endpoint (blocks the entire checkout flow)
- [ ] Fix the Stripe webhook edge case (has been shifting for 3 days, needs to settle)
- [ ] Connect the settings save button (quick win, UI is already done)
- [ ] Add error states to the checkout form (needed before launch)

Rules:
- 3-7 tasks max. Prioritize ruthlessly.
- Infer tasks from Left Off and Still Shifting sections of the digest. These are suggestions based on what Scout can see, not orders.
- First item should always be the single most impactful thing to do next.
- Use plain language, no file names or code paths.
- Every task must be specific enough to act on without context. "Fix the webhook" not "work on checkout."
- Include a parenthetical reason for each task explaining why it's at that priority.

SECTION 4: AI CONTEXT (after ---AI_CONTEXT---)
Tone: Pure technical. No personality. This is read by an AI coding tool, not a human.

Format:
Tech Stack
[one paragraph]
Recent Work
[2-3 sentences with file paths]
Current Focus
[what's next, what's done, what's remaining]
Key Files
  \u2022 [file paths]
Heads Up
  \u2022 [warnings]

SECTION 5: PROJECT SUMMARY (after ---SUMMARY---)
Write a ~200 word paragraph summarizing this project as context for your future self. Cover: tech stack, architecture, current state of the codebase, what was worked on in this session, and any known issues or areas that keep shifting. Be specific and dense. No bullet points. This will be fed back to you on the next run so write it to be maximally useful. If Previous Project Context was provided, build on it. If not, start fresh.

GLOBAL RULES:
- NEVER use em dashes or semicolons. Use commas and periods.
- Use \u2022 bullet character for ALL lists, never dashes or asterisks.
- Do NOT include stats lines. Stats are handled separately.
- Be concise. No filler.`;
}

export function buildSystemPrompt(): string {
  return `You are Scout, a sharp, warm friend who actually looked at the code. Talk like a human, not a changelog. Every description should feel like someone explaining what happened over coffee. Use plain language a non-technical person could mostly follow. Have a point of view.

BANNED PHRASES — never use any of these:
- "great work", "keep it up", "crushing it", "nice job", "awesome", "solid progress", "you crushed it", "solid day"
- "implemented", "utilized", "leveraged", "facilitated"
- "various", "multiple things", "numerous", "several"
- "in conclusion", "overall", "to summarize"
- em dashes, semicolons

WRITING RULES:
- NEVER use em dashes or semicolons. Use commas and periods.
- Write like a real human, not like AI. Keep it casual and natural.
- Every bullet should be 1-2 full sentences of real context, not a label and a fragment.
- NEVER use file names, function names, or code paths in summaries. Translate everything to features and behaviors.

Respond ONLY with valid JSON matching the schema described in the user message. No markdown fences, no explanation, just raw JSON.`;
}

export function formatCommitsForPrompt(commits: GitCommit[]): string {
  // Sort chronologically (earliest first) so the LLM understands
  // what happened first vs last, and can detect reverts.
  const chronological = [...commits].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  return chronological
    .map((c, i) => {
      const short = c.hash.slice(0, 7);
      const time = c.timestamp.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      return `${i + 1}. [${time}] ${short} ${c.message}`;
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

  // Build churn data
  const fileFrequency = new Map<string, number>();
  for (const c of commits) {
    for (const f of c.filesChanged) {
      fileFrequency.set(f, (fileFrequency.get(f) ?? 0) + 1);
    }
  }
  const churnList = [...fileFrequency.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([file, count]) => `- ${file} (${count} commits)`)
    .join("\n");

  return `Analyze the following git activity and produce a structured digest.

## Previous Project Context
${context}

## Commits (in chronological order, earliest first)
${formatCommitsForPrompt(commits)}

IMPORTANT: The commits above are in TIME ORDER. The LAST commits are what the user was working on most recently, so use those for leftOff. If something was built then reverted (or fixed then broken again), only the FINAL state matters for shipped/changed. If a revert appears after a feature commit, that feature was NOT shipped.

## What Changed (file diffs)
Use these diffs to understand WHAT was actually built, changed, or fixed. Don't just rely on commit messages. The code tells the real story.

${formatDiffsForPrompt(diffs)}
${churnList ? `\n## Churn (files edited 3+ times — these are your unstable/still-shifting candidates)\n${churnList}` : ""}

## Section Definitions
- **shipped**: Things that went from not existing to working. New features, new pages, new endpoints. What can the user do now that they couldn't before?
- **changed**: Things that already existed but got modified. Redesigns, refactors, config changes. What is different and why?
- **unstable**: Areas reworked 3+ times. Use the Churn data above. Describe as features, NEVER file names. Explain what keeps changing and why it hasn't settled. Include changeCount.
- **leftOff**: Everything in progress when the session ended. Include ALL of them. Be concrete about what works vs what doesn't and what the next step is.
- **vibeCheck**: 3-4 casual PRESENT-TENSE sentences about where the project stands RIGHT NOW. Not a recap. Have a point of view. Notice what they're avoiding or circling. Sneak in one genuinely witty observation.
- **keyTakeaways**: 2-3 sentences. Scout's honest sign-off. Start with the sharpest observation about what actually happened. Then a nudge about the next meaningful move. End with a moment of warmth or wit. NO motivational filler, NO "keep it up" energy.
- **resumeContext**: Rich context for AI coding tools:
  - **techStack**: What the project is built with. Be specific.
  - **recentWork**: 2-3 sentences about what was recently built, referencing files from the diffs.
  - **currentFocus**: What to work on next. Specific about what's done and what's left.
  - **keyFiles**: 3-6 file paths most relevant to current work.
  - **warnings**: Things to avoid or be careful about.
- **standupNotes**: For Slack. Casual but clear:
  - **yesterday**: What shipped or changed. Be specific about what was accomplished.
  - **today**: Clear next steps inferred from leftOff. "Wire up the payment form" not "continue working on checkout."
  - **blockers**: Use churn data. If files keep getting reworked, that is a blocker. Only "None" if genuinely nothing is stuck.
- **updatedSummary**: ~200 word project summary covering tech stack, architecture, current state, and what was last worked on. Replaces the previous summary entirely.

${healthInstructions}

Respond with this exact JSON schema:
{
  "vibeCheck": "...",
  "shipped": [{ "summary": "..." }],
  "changed": [{ "summary": "..." }],
  "unstable": [{ "summary": "...", "changeCount": 0 }],
  "leftOff": [{ "summary": "..." }],
  "keyTakeaways": "...",
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
  const keyTakeaways = typeof parsed.keyTakeaways === "string" ? parsed.keyTakeaways : "";
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
    keyTakeaways,
    resumeContext,
    standupNotes,
  };

  return { digest, updatedSummary };
}
