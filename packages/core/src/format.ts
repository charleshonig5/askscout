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
    return `${label} ${healthBar(h.score)} ${h.level} \u2014 ${h.detail}`;
  });
  return `\n\ud83e\ude7a Project Health\n${lines.join("\n")}`;
}

/** Format a digest as a human-readable string for terminal or web */
export function formatDigest(digest: Digest): string {
  const sections: string[] = [];

  if (digest.shipped.length > 0) {
    const n = digest.shipped.length;
    const items = digest.shipped.map((i) => `  \u2022 ${i.summary}`).join("\n");
    sections.push(`\ud83d\ude80 Shipped\nScout found ${n} new ${plural(n, "feature")}:\n${items}`);
  }

  if (digest.changed.length > 0) {
    const n = digest.changed.length;
    const items = digest.changed.map((i) => `  \u2022 ${i.summary}`).join("\n");
    sections.push(
      `\ud83d\udd27 Changed\nScout noticed ${n} ${plural(n, "thing")} look different:\n${items}`,
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
    sections.push(`\ud83d\udccd Left Off\nLast thing you were working on:\n${items}`);
  }

  // Stats line
  const s = digest.stats;
  sections.push(
    `\ud83d\udcca ${fmt(s.filesChanged)} ${plural(s.filesChanged, "file")} touched \u00b7 ${fmt(s.linesAdded)} ${plural(s.linesAdded, "line")} added \u00b7 ${fmt(s.linesRemoved)} removed`,
  );

  // Health indicators (only if available)
  if (digest.health && digest.health.length > 0) {
    sections.push(formatHealthSection(digest.health));
  }

  return sections.join("\n\n") + "\n";
}

/** Format a resume prompt from digest data */
export function formatResume(digest: Digest): ResumePrompt {
  const parts: string[] = [];

  if (digest.shipped.length > 0) {
    parts.push(`Recently shipped: ${digest.shipped.map((i) => i.summary).join("; ")}.`);
  }
  if (digest.changed.length > 0) {
    parts.push(`Recent changes: ${digest.changed.map((i) => i.summary).join("; ")}.`);
  }
  if (digest.unstable.length > 0) {
    parts.push(`Potentially unstable areas: ${digest.unstable.map((i) => i.summary).join("; ")}.`);
  }
  if (digest.leftOff.length > 0) {
    parts.push(`Continue working on: ${digest.leftOff.map((i) => i.summary).join("; ")}.`);
  }

  return { prompt: parts.join(" ") };
}

/** Format a standup summary from digest data */
export function formatStandup(digest: Digest): Standup {
  return {
    done: digest.shipped.map((i) => i.summary),
    inProgress: digest.leftOff.map((i) => i.summary),
    blockers: digest.unstable.map((i) => i.summary),
  };
}
