import type { Digest, ResumePrompt, Standup } from "./types.js";

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

/** Terminal column width. 80 is the safe legacy default; modern
 *  terminals report 100+. Used to decide whether to render
 *  decorative bars in the Most Active Files block. */
function getTerminalWidth(): number {
  if (typeof process === "undefined") return 80;
  return process.stdout?.columns ?? 80;
}

/** Plain-text fallbacks for emoji section headers. Bracketed labels
 *  read clearly when output is piped to a file or CI log — easier to
 *  grep than emoji glyphs and never breaks in a non-unicode terminal. */
const PLAIN_HEADERS = {
  vibe: "[Vibe Check]",
  shipped: "[Shipped]",
  changed: "[Changed]",
  unstable: "[Still Shifting]",
  leftOff: "[Left Off]",
  takeaways: "[Key Takeaways]",
  timeline: "[Coding Timeline]",
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

  // Stats inline
  sections.push(
    `   +${fmt(s.linesAdded)} lines${
      s.linesRemoved > 0 ? `${sep}-${fmt(s.linesRemoved)} lines` : ""
    }${sep}${fmt(s.commits)} commits${sep}${fmt(s.filesChanged)} files`,
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

/** Format codebase health for the terminal */
export function formatCodebaseHealth(
  commits: { filesChanged: string[]; additions: number; deletions: number }[],
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

  // Top files section. Bar rendering is gated on rich output AND
  // terminal width \u2014 narrow terminals (<60 cols) and non-TTY pipes
  // get a clean count-only fallback that won't wrap or break
  // grep/jq pipelines downstream.
  if (topFiles.length > 0) {
    const maxCount = topFiles[0]![1];
    const useBars = isRichOutput() && getTerminalWidth() >= 60;
    const fileLines = topFiles
      .map(([file, count]) => {
        const name = file.split("/").pop() ?? file;
        if (useBars) {
          const barLen = Math.round((count / maxCount) * 10);
          const bar = "\u2588".repeat(barLen) + "\u2591".repeat(10 - barLen);
          return `  ${name.padEnd(24)} ${bar} ${count} commits`;
        }
        return `  ${name} (${count} commits)`;
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

/** Format a Coding Timeline section from commit timestamps. Renders
 *  as a session breakdown — consecutive commits with no gap >30 min
 *  cluster into one session, surfacing the *structure* of the day
 *  rather than a bar histogram (which is the right format on web but
 *  reads as line noise in a terminal).
 *
 *  Same data source as the web's bar chart — both ultimately mirror
 *  the user's commit timestamps — but the CLI presentation is plain
 *  English ranges + counts so it reads cleanly in a pipe or log.
 *
 *  Returns "" for empty commit lists so callers can safely skip the
 *  section without checking length themselves. */
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

  // Cluster into sessions. A 30-minute idle gap closes the current
  // session and opens a new one — the same threshold most coding-
  // tracker tools use ("focused work block" boundary).
  const SESSION_GAP_MS = 30 * 60 * 1000;
  const sessions: Array<{ start: Date; end: Date; count: number }> = [];
  let cur: { start: Date; end: Date; count: number } | null = null;
  for (const t of sorted) {
    if (!cur || t.getTime() - cur.end.getTime() > SESSION_GAP_MS) {
      if (cur) sessions.push(cur);
      cur = { start: t, end: t, count: 1 };
    } else {
      cur.end = t;
      cur.count += 1;
    }
  }
  if (cur) sessions.push(cur);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const rich = isRichOutput();
  const dash = rich ? "–" : "-";
  const lines = sessions.map((s) => {
    const range =
      s.start.getTime() === s.end.getTime()
        ? fmtTime(s.start)
        : `${fmtTime(s.start)} ${dash} ${fmtTime(s.end)}`;
    const label = s.count === 1 ? "commit" : "commits";
    return `  ${range} (${s.count} ${label})`;
  });

  const header = rich ? "🕐 Coding Timeline" : PLAIN_HEADERS.timeline;
  return `${header}\n${lines.join("\n")}`;
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
