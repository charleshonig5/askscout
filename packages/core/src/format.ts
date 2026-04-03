import type { Digest, ResumePrompt, Standup } from "./types.js";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

export interface FormatOptions {
  repoName: string;
  timeLabel: string;
}

/** Format a digest as a human-readable string for the terminal */
export function formatDigest(digest: Digest, options: FormatOptions): string {
  const sections: string[] = [];
  const s = digest.stats;

  // Intro header
  sections.push(
    `\ud83d\udc15 Scout sniffed through ${options.repoName}\n` +
      `   ${fmt(s.commits)} commits \u00b7 ${fmt(s.filesChanged)} files \u00b7 ${options.timeLabel}`,
  );

  // Vibe check
  if (digest.vibeCheck) {
    sections.push(`\ud83d\udcac Vibe Check\n${digest.vibeCheck}`);
  }

  // Stats inline
  const net = s.linesAdded - s.linesRemoved;
  sections.push(
    `   ${fmt(s.commits)} commits \u00b7 ${fmt(s.filesChanged)} files \u00b7 ${net >= 0 ? "+" : ""}${fmt(net)} lines`,
  );

  // Shipped
  if (digest.shipped.length > 0) {
    const items = digest.shipped.map((i) => `  \u2022 ${i.summary}`).join("\n");
    sections.push(`\ud83d\ude80 Shipped  ${digest.shipped.length}\n${items}`);
  }

  // Changed
  if (digest.changed.length > 0) {
    const items = digest.changed.map((i) => `  \u2022 ${i.summary}`).join("\n");
    sections.push(`\ud83d\udd27 Changed  ${digest.changed.length}\n${items}`);
  }

  // Unstable
  if (digest.unstable.length > 0) {
    const items = digest.unstable
      .map((i) => `  \u2022 ${i.summary}, changed ${i.changeCount} times, still wobbly`)
      .join("\n");
    sections.push(`\u26a0\ufe0f Unstable  ${digest.unstable.length}\n${items}`);
  }

  // Left Off
  if (digest.leftOff.length > 0) {
    const items = digest.leftOff.map((i) => `  \u2022 ${i.summary}`).join("\n");
    sections.push(`\ud83d\udccd Left Off  ${digest.leftOff.length}\n${items}`);
  }

  return sections.join("\n\n") + "\n";
}

/** Format codebase health for the terminal */
export function formatCodebaseHealth(commits: { filesChanged: string[] }[]): string {
  // Compute metrics
  const fileFrequency = new Map<string, number>();
  let totalFilesPerCommit = 0;
  for (const c of commits) {
    totalFilesPerCommit += c.filesChanged.length;
    for (const f of c.filesChanged) {
      fileFrequency.set(f, (fileFrequency.get(f) ?? 0) + 1);
    }
  }

  const filesPerCommit =
    commits.length > 0 ? Math.round((totalFilesPerCommit / commits.length) * 10) / 10 : 0;
  const churnFiles = [...fileFrequency.entries()].filter(([, count]) => count >= 3).length;

  // Top files
  const topFiles = [...fileFrequency.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const sections: string[] = [];

  // Top files section
  if (topFiles.length > 0) {
    const maxCount = topFiles[0]![1];
    const fileLines = topFiles
      .map(([file, count]) => {
        const name = file.split("/").pop() ?? file;
        const barLen = Math.round((count / maxCount) * 10);
        const bar = "\u2588".repeat(barLen) + "\u2591".repeat(10 - barLen);
        return `  ${name.padEnd(24)} ${bar} ${count} commits`;
      })
      .join("\n");
    sections.push(`Most Active Files\n${fileLines}`);
  }

  // Health indicators
  const focusLevel = filesPerCommit <= 3 ? "Sharp" : filesPerCommit <= 8 ? "Moderate" : "Scattered";
  const churnLevel =
    churnFiles === 0 ? "Clean" : churnFiles <= 3 ? "Low" : churnFiles <= 7 ? "Moderate" : "High";

  const healthLines = [
    `  Focus      ${focusLevel.padEnd(10)} ${filesPerCommit} files/commit`,
    `  Churn      ${churnLevel.padEnd(10)} ${churnFiles} files reworked`,
  ].join("\n");

  sections.push(`Codebase Health\n${healthLines}`);

  return sections.join("\n\n");
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
