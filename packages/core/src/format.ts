import type { Digest, HealthIndicator, ResumePrompt, Standup } from "./types.js";

function plural(count: number, singular: string, pluralForm?: string): string {
  return count === 1 ? singular : (pluralForm ?? `${singular}s`);
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function healthBar(score: number): string {
  const filled = Math.round(Math.max(0, Math.min(10, score)));
  const empty = 10 - filled;
  return "\u2588".repeat(filled) + "\u2591".repeat(empty);
}

function formatHealthSection(indicators: HealthIndicator[]): string {
  const lines = indicators.map((h) => {
    const label = h.label.padEnd(10);
    return `  ${label} ${healthBar(h.score)} ${h.level} \u2014 ${h.detail}`;
  });
  return `\ud83e\ude7a Project Health\n${lines.join("\n")}`;
}

export interface FormatOptions {
  repoName: string;
  timeLabel: string;
}

/** Format a digest as a human-readable string for terminal or web */
export function formatDigest(digest: Digest, options: FormatOptions): string {
  const sections: string[] = [];
  const s = digest.stats;

  // Intro header
  sections.push(
    `\ud83d\udc15 Scout sniffed through ${options.repoName}\n` +
      `   ${fmt(s.commits)} ${plural(s.commits, "commit")} \u00b7 ${fmt(s.filesChanged)} ${plural(s.filesChanged, "file")} \u00b7 ${options.timeLabel}`,
  );

  // Vibe check
  if (digest.vibeCheck) {
    sections.push(`\ud83d\udcac Vibe Check\n${digest.vibeCheck}`);
  }

  if (digest.shipped.length > 0) {
    const n = digest.shipped.length;
    const items = digest.shipped.map((i) => `  \u2022 ${i.summary}`).join("\n");
    sections.push(
      `\ud83d\ude80 Shipped\nScout dug up ${n} new ${plural(n, "thing")} you got working:\n${items}`,
    );
  }

  if (digest.changed.length > 0) {
    const n = digest.changed.length;
    const items = digest.changed.map((i) => `  \u2022 ${i.summary}`).join("\n");
    sections.push(
      `\ud83d\udd27 Changed\nScout noticed you were poking around in ${n} ${plural(n, "spot")}:\n${items}`,
    );
  }

  if (digest.unstable.length > 0) {
    const n = digest.unstable.length;
    const label = n === 1 ? "this one" : "these";
    const items = digest.unstable
      .map(
        (i) =>
          `  \u2022 ${i.summary} \u2014 changed ${i.changeCount} ${plural(i.changeCount, "time")}, still wobbly`,
      )
      .join("\n");
    sections.push(`\u26a0\ufe0f Unstable\nScout keeps tripping over ${label}:\n${items}`);
  }

  if (digest.leftOff.length > 0) {
    const items = digest.leftOff.map((i) => `  \u2022 ${i.summary}`).join("\n");
    sections.push(`\ud83d\udccd Left Off\nHere's where you left your bone:\n${items}`);
  }

  // Stats line
  const statsLine = `\ud83d\udcca ${fmt(s.linesAdded)} ${plural(s.linesAdded, "line")} added \u00b7 ${fmt(s.linesRemoved)} removed`;
  sections.push(statsLine);

  // Health indicators (only if available)
  if (digest.health && digest.health.length > 0) {
    sections.push(formatHealthSection(digest.health));
  }

  return sections.join("\n\n") + "\n";
}

/** Format a resume prompt from digest data — rich context for AI coding tools */
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

/** Format a standup summary from digest data — conversational, human-sounding */
export function formatStandup(digest: Digest): Standup {
  const s = digest.standupNotes;
  return {
    yesterday: s.yesterday.length > 0 ? s.yesterday : digest.shipped.map((i) => i.summary),
    today: s.today.length > 0 ? s.today : digest.leftOff.map((i) => i.summary),
    blockers: s.blockers.length > 0 ? s.blockers : digest.unstable.map((i) => i.summary),
  };
}
