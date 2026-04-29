import type { Digest, DigestRunSummary, ResumePrompt, Standup } from "./types.js";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

/** Whether the current invocation should render rich output (emoji,
 *  unicode block bars). Falsy when:
 *    - NO_COLOR env var is set (per https://no-color.org spec)
 *    - stdout isn't a TTY (output is being piped or redirected)
 *  Both signal a non-interactive context where plain ASCII is more
 *  reliable. Defaults to true when process isn't available (e.g.
 *  browser test envs that don't tree-shake this module). */
function isRichOutput(): boolean {
  if (typeof process === "undefined") return true;
  if (process.env?.NO_COLOR) return false;
  if (process.stdout && process.stdout.isTTY === false) return false;
  return true;
}

/** Plain-text fallbacks for the LLM-narrative section headers. These
 *  fire when stdout isn't a TTY or NO_COLOR is set — bracketed
 *  labels read clearly in pipes/CI logs. Sub-section headers
 *  (Coding Timeline, Pace Check, Most Active Files, Codebase
 *  Health) intentionally use plain prose without brackets in both
 *  modes, matching the web's stats-subsection convention. */
const PLAIN_HEADERS = {
  vibe: "[Vibe Check]",
  shipped: "[Shipped]",
  changed: "[Changed]",
  unstable: "[Still Shifting]",
  leftOff: "[Left Off]",
  takeaways: "[Key Takeaways]",
};

export interface FormatOptions {
  repoName: string;
  timeLabel: string;
}

/** Format a digest as a human-readable string for the terminal.
 *  Renders with emoji headers + unicode bullets in interactive
 *  terminals, falls back to bracketed plain-text labels when piped
 *  or NO_COLOR is set. */
export function formatDigest(digest: Digest, options: FormatOptions): string {
  const rich = isRichOutput();
  const bullet = rich ? "\u2022" : "-";
  const sep = rich ? " \u00b7 " : " | ";
  const sections: string[] = [];
  const s = digest.stats;

  // Intro header. "Scout" stays as the brand; verb tweaked from
  // "sniffed through" to "scanned" to keep the dog-metaphor language
  // out of the brand voice (matches the web side, which also doesn't
  // use canine framing in any user-facing copy).
  const introHeader = rich ? "\ud83d\udd0d Scout scanned" : "Scout scanned";
  sections.push(
    `${introHeader} ${options.repoName}\n` +
      `   ${fmt(s.commits)} commits${sep}${fmt(s.filesChanged)} files${sep}${options.timeLabel}`,
  );

  // Vibe check
  if (digest.vibeCheck) {
    const header = rich ? "\ud83d\udcac Vibe Check" : PLAIN_HEADERS.vibe;
    sections.push(`${header}\n${digest.vibeCheck}`);
  }

  // Stats inline. Mirrors the web's copy-markdown exactly: always
  // shows the -lines half even when zero (DigestView.tsx:83). Keeps
  // the +/- pair symmetric so users always see both halves of the
  // line-change count.
  sections.push(
    `   +${fmt(s.linesAdded)} lines${sep}-${fmt(s.linesRemoved)} lines${sep}${fmt(s.commits)} commits${sep}${fmt(s.filesChanged)} files`,
  );

  // Shipped
  if (digest.shipped.length > 0) {
    const items = digest.shipped.map((i) => `  ${bullet} ${i.summary}`).join("\n");
    const header = rich ? "\ud83d\ude80 Shipped" : PLAIN_HEADERS.shipped;
    sections.push(`${header}  ${digest.shipped.length}\n${items}`);
  }

  // Changed
  if (digest.changed.length > 0) {
    const items = digest.changed.map((i) => `  ${bullet} ${i.summary}`).join("\n");
    const header = rich ? "\ud83d\udd27 Changed" : PLAIN_HEADERS.changed;
    sections.push(`${header}  ${digest.changed.length}\n${items}`);
  }

  // Still Shifting \u2014 drop the auto-suffix ("changed N times, still
  // shifting") and let the LLM-written summary speak for itself.
  // Matches the web rendering, which also shows the bare summary.
  // The changeCount data is no longer surfaced; it was redundant
  // narration that read awkwardly next to the LLM's natural prose.
  if (digest.unstable.length > 0) {
    const items = digest.unstable.map((i) => `  ${bullet} ${i.summary}`).join("\n");
    const header = rich ? "\ud83d\udd01 Still Shifting" : PLAIN_HEADERS.unstable;
    sections.push(`${header}  ${digest.unstable.length}\n${items}`);
  }

  // Left Off
  if (digest.leftOff.length > 0) {
    const items = digest.leftOff.map((i) => `  ${bullet} ${i.summary}`).join("\n");
    const header = rich ? "\ud83d\udccd Left Off" : PLAIN_HEADERS.leftOff;
    sections.push(`${header}  ${digest.leftOff.length}\n${items}`);
  }

  // Key Takeaways
  if (digest.keyTakeaways) {
    const header = rich ? "\ud83d\udd11 Key Takeaways" : PLAIN_HEADERS.takeaways;
    sections.push(`${header}\n${digest.keyTakeaways}`);
  }

  return sections.join("\n\n") + "\n";
}

/** Format codebase health for the terminal. Optional `diffs`
 *  parameter unlocks per-file +/- line stats in the Most Active
 *  Files block (matching the web's copy-markdown format). When
 *  diffs aren't supplied we fall back to a count-only listing
 *  (older callers continue to work). */
export function formatCodebaseHealth(
  commits: { filesChanged: string[]; additions: number; deletions: number }[],
  diffs?: { file: string; additions: number; deletions: number }[],
): string {
  // Compute metrics
  const fileFrequency = new Map<string, number>();
  let totalFilesPerCommit = 0;
  let totalAdded = 0;
  let totalRemoved = 0;
  for (const c of commits) {
    totalFilesPerCommit += c.filesChanged.length;
    totalAdded += c.additions;
    totalRemoved += c.deletions;
    for (const f of c.filesChanged) {
      fileFrequency.set(f, (fileFrequency.get(f) ?? 0) + 1);
    }
  }

  const filesPerCommit =
    commits.length > 0 ? Math.round((totalFilesPerCommit / commits.length) * 10) / 10 : 0;
  const churnFiles = [...fileFrequency.entries()].filter(([, count]) => count >= 3).length;
  const growthRatio = totalRemoved > 0 ? totalAdded / totalRemoved : totalAdded > 0 ? 99 : 1;

  // Top files
  const topFiles = [...fileFrequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const sections: string[] = [];

  // Top files block \u2014 rendered as a numbered list with per-file
  // additions/deletions and commit count, matching the web copy
  // markdown exactly (DigestView.tsx:92):
  //   "1. path/to/file (+47 / -12, 3 commits)"
  // Drops the previous bar visualization \u2014 web doesn't show bars
  // here, so keeping them caused visual drift between surfaces.
  // When `diffs` aren't supplied (older callers), per-file +/-
  // collapses to zero gracefully rather than throwing.
  if (topFiles.length > 0) {
    const diffByFile = new Map<string, { additions: number; deletions: number }>(
      (diffs ?? []).map((d) => [d.file, { additions: d.additions, deletions: d.deletions }]),
    );
    const fileLines = topFiles
      .map(([file, count], i) => {
        const d = diffByFile.get(file);
        const added = d?.additions ?? 0;
        const removed = d?.deletions ?? 0;
        const commitLabel = count === 1 ? "commit" : "commits";
        return `${i + 1}. ${file} (+${fmt(added)} / -${fmt(removed)}, ${count} ${commitLabel})`;
      })
      .join("\n");
    sections.push(`Most Active Files\n${fileLines}`);
  }

  // Health indicators (5 levels each)
  const growthLevel =
    growthRatio <= 3
      ? "Lean"
      : growthRatio <= 8
        ? "Steady"
        : growthRatio <= 20
          ? "Growing"
          : growthRatio <= 40
            ? "Heavy"
            : "Ballooning";

  const focusLevel =
    filesPerCommit <= 3
      ? "Tight"
      : filesPerCommit <= 6
        ? "Sharp"
        : filesPerCommit <= 12
          ? "Moderate"
          : filesPerCommit <= 20
            ? "Wide"
            : "Scattered";

  const churnLevel =
    churnFiles === 0
      ? "Clean"
      : churnFiles <= 3
        ? "Minimal"
        : churnFiles <= 7
          ? "Moderate"
          : churnFiles <= 12
            ? "Noisy"
            : "High";

  const healthLines = [
    `  Growth     ${growthLevel.padEnd(12)} +${fmt(totalAdded)} / -${fmt(totalRemoved)}`,
    `  Focus      ${focusLevel.padEnd(12)} ${filesPerCommit} files touched per commit`,
    `  Churn      ${churnLevel.padEnd(12)} ${churnFiles} files reworked`,
  ].join("\n");

  sections.push(`Codebase Health\n${healthLines}`);

  return sections.join("\n\n");
}

/** Format a Coding Timeline section from commit timestamps.
 *  Mirrors the web's copy-markdown exactly (DigestView.tsx:115–126):
 *  one summary line spanning the first to last commit of the
 *  timeline, with lowercase 12-hour times and a "·" separator
 *  between range and count:
 *
 *    Coding Timeline
 *    9:14 am to 4:30 pm · 12 commits
 *
 *  Single-point days (one commit, or all commits at the same
 *  minute) collapse the range to a single time:
 *
 *    Coding Timeline
 *    3:30 pm · 1 commit
 *
 *  Returns "" for empty commit lists so callers can safely skip
 *  the section without checking length themselves. */
export function formatCodingTimeline(commits: { timestamp: Date | string }[]): string {
  if (commits.length === 0) return "";

  // Normalize + sort by timestamp ascending. Accepts string or Date
  // since the CLI's GitCommit shape uses Date but the web payload
  // serializes to strings; keeps the function reusable across both.
  const sorted = [...commits]
    .map((c) => (c.timestamp instanceof Date ? c.timestamp : new Date(c.timestamp)))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (sorted.length === 0) return "";

  // Lowercase to match the web's .toLowerCase() at DigestView.tsx:119.
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();

  const start = sorted[0]!;
  const end = sorted[sorted.length - 1]!;
  const range =
    start.getTime() === end.getTime() ? fmtTime(start) : `${fmtTime(start)} to ${fmtTime(end)}`;
  const count = sorted.length;
  const commitLabel = count === 1 ? "commit" : "commits";
  const sep = isRichOutput() ? " · " : " | ";

  // Plain "Coding Timeline" header with no emoji prefix — matches
  // the web subsection title which uses .stats-subsection-title
  // (no emoji) per DigestView.tsx:88.
  return `Coding Timeline\n${range}${sep}${count} ${commitLabel}`;
}

/** Pick the editorial label for a pace multiplier. Bands and copy
 *  match the web side exactly — see
 *  apps/web/src/app/api/digest/stream/route.ts:343–351 — so users
 *  reading both surfaces see the same characterizations of the same
 *  multiplier. */
function paceLabel(multiplier: number): string {
  if (multiplier >= 4) return "Whatever's in that water, keep drinking it.";
  if (multiplier >= 3) return "You tripled your usual output. Scout is genuinely impressed.";
  if (multiplier >= 2) return "Twice your usual pace. That's not a fluke, that's focus.";
  if (multiplier >= 1.3) return "A little faster than usual. Good rhythm today.";
  if (multiplier >= 0.8) return "Right in your groove. Steady as always.";
  if (multiplier >= 0.5) return "Lighter day. Not every day needs to be a marathon.";
  return "Quiet one. Not much shipped today.";
}

/** Format a Pace Check section from today's commit count + recent
 *  digest history. Mirrors the web's copy-markdown exactly
 *  (DigestView.tsx:129–135) — two lines under a plain header:
 *
 *    Pace Check
 *    1.7x · {label}
 *    12 commits today · 7-commit avg
 *
 *  Pre-conditions for any output:
 *    - At least 3 prior digest runs in `history` (matches the web
 *      threshold — anything less and the multiplier is statistical
 *      noise)
 *    - Average prior commit count > 0
 *
 *  When pre-conditions aren't met, returns "" so callers can safely
 *  skip the section without checking themselves. */
export function formatPaceCheck(opts: {
  todayCommits: number;
  history: DigestRunSummary[];
}): string {
  const { todayCommits, history } = opts;
  if (history.length < 3) return "";

  // Use the most recent 3 entries — same as the web (route.ts:332).
  // Slicing from the end means we always get the freshest baseline
  // even if STATE_HISTORY_CAP grew the window beyond 3.
  const recent = history.slice(-3);
  const avgCommits = recent.reduce((sum, r) => sum + r.commits, 0) / recent.length;
  if (avgCommits <= 0) return "";

  const multiplier = Math.round((todayCommits / avgCommits) * 10) / 10;
  const roundedAvg = Math.round(avgCommits);
  const label = paceLabel(multiplier);
  const sep = isRichOutput() ? " · " : " | ";

  // Plain "Pace Check" header with no emoji prefix to match the
  // web sub-section convention (DigestView.tsx:132).
  return [
    "Pace Check",
    `${multiplier}x${sep}${label}`,
    `${todayCommits} commits today${sep}${roundedAvg}-commit avg`,
  ].join("\n");
}

/** Format a resume prompt from digest data */
export function formatResume(digest: Digest): ResumePrompt {
  const r = digest.resumeContext;
  const sections: string[] = [];

  if (r.techStack) sections.push(`Tech Stack\n${r.techStack}`);
  if (r.recentWork) sections.push(`Recent Work\n${r.recentWork}`);
  if (r.currentFocus) sections.push(`Current Focus\n${r.currentFocus}`);
  if (r.keyFiles.length > 0) sections.push(`Key Files\n${r.keyFiles.join("\n")}`);
  if (r.warnings.length > 0) sections.push(`\u26a0\ufe0f Heads Up\n${r.warnings.join("\n")}`);

  return { prompt: sections.join("\n\n") };
}

/** Format a standup summary from digest data */
export function formatStandup(digest: Digest): Standup {
  const s = digest.standupNotes;
  return {
    yesterday: s.yesterday.length > 0 ? s.yesterday : digest.shipped.map((i) => i.summary),
    today: s.today.length > 0 ? s.today : digest.leftOff.map((i) => i.summary),
    blockers: s.blockers.length > 0 ? s.blockers : digest.unstable.map((i) => i.summary),
  };
}
