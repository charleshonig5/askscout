import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  formatCodebaseHealth,
  formatCodingTimeline,
  formatDigest,
  formatPaceCheck,
  formatResume,
  formatStandup,
} from "../format.js";
import type { Digest, DigestRunSummary, GitCommit, GitDiff } from "../types.js";

/**
 * Tests for `format.ts` — terminal output renderers.
 *
 * Covers:
 *   - formatDigest: section rendering, empty-section skipping, stats line
 *     symmetry, rich vs plain (NO_COLOR / non-TTY) fallbacks
 *   - formatCodebaseHealth: top-files numbering, +/- stats from diffs,
 *     count-only fallback when diffs absent, level thresholds (Lean /
 *     Steady / Tight / Sharp / Clean / Minimal), "files touched per commit"
 *     wording
 *   - formatCodingTimeline: empty → "", single point → single time, range →
 *     "to" separator, lowercase times, both Date and string inputs, filters
 *     NaN
 *   - formatPaceCheck: <3 history → "", avg=0 → "", multiplier math,
 *     label band picks, "N-commit avg" hyphen
 *   - formatResume: optional sections skipped, "Heads Up" present
 *   - formatStandup: standupNotes preferred, falls back to digest sections
 *
 * Rich-vs-plain testing strategy: most rendering details match between
 * the two modes (text content, structure). The differences live in the
 * separator (` · ` vs ` | `) and section headers (emoji vs bracketed
 * labels). We assert those specific differences directly rather than
 * snapshotting the whole output, so brand-emoji choices can change
 * without rewriting every test.
 */

// Backup + restore the bits of process we monkey-patch so tests don't
// leak state into each other.
let savedNoColor: string | undefined;
let savedIsTTY: boolean | undefined;

beforeEach(() => {
  savedNoColor = process.env.NO_COLOR;
  savedIsTTY = process.stdout.isTTY;
});

afterEach(() => {
  if (savedNoColor === undefined) {
    delete process.env.NO_COLOR;
  } else {
    process.env.NO_COLOR = savedNoColor;
  }
  // process.stdout.isTTY is a getter on the underlying stream; setting
  // it directly works in Node.
  Object.defineProperty(process.stdout, "isTTY", {
    value: savedIsTTY,
    writable: true,
    configurable: true,
  });
});

function setRich(): void {
  delete process.env.NO_COLOR;
  Object.defineProperty(process.stdout, "isTTY", {
    value: true,
    writable: true,
    configurable: true,
  });
}

function setPlain(): void {
  process.env.NO_COLOR = "1";
  Object.defineProperty(process.stdout, "isTTY", {
    value: false,
    writable: true,
    configurable: true,
  });
}

function makeDigest(overrides: Partial<Digest> = {}): Digest {
  const base: Digest = {
    vibeCheck: "Solid afternoon of focused work.",
    shipped: [{ summary: "Wired up the new export pipeline." }],
    changed: [{ summary: "Tightened the cache key for repeat fetches." }],
    unstable: [{ summary: "The streak badge gate, now state-backed.", changeCount: 3 }],
    leftOff: [{ summary: "Mid-way through the test fixture refactor." }],
    stats: {
      commits: 12,
      filesChanged: 4,
      linesAdded: 318,
      linesRemoved: 47,
      timeSpan: { from: new Date("2026-04-30T09:00:00Z"), to: new Date("2026-04-30T17:00:00Z") },
    },
    health: null,
    keyTakeaways: "Keep the chunk small, the diffs honest.",
    resumeContext: {
      techStack: "TypeScript, Next.js",
      recentWork: "State-backed gate work",
      currentFocus: "Test coverage on core",
      keyFiles: ["packages/core/src/state.ts"],
      warnings: [],
    },
    standupNotes: { yesterday: [], today: [], blockers: [] },
  };
  return { ...base, ...overrides };
}

// =====================================================================
// formatDigest
// =====================================================================

describe("formatDigest", () => {
  const opts = { repoName: "owner/repo", timeLabel: "today" };

  it("renders the intro line with repo + counts in rich mode", () => {
    setRich();
    const out = formatDigest(makeDigest(), opts);
    expect(out).toMatch(/Scout scanned owner\/repo/);
    expect(out).toContain("12 commits");
    expect(out).toContain("4 files");
    expect(out).toContain("today");
  });

  it("renders all sections when populated", () => {
    setRich();
    const out = formatDigest(makeDigest(), opts);
    expect(out).toContain("Vibe Check");
    expect(out).toContain("Shipped");
    expect(out).toContain("Changed");
    expect(out).toContain("Still Shifting");
    expect(out).toContain("Left Off");
    expect(out).toContain("Key Takeaways");
  });

  it("skips empty narrative sections cleanly", () => {
    setRich();
    const out = formatDigest(
      makeDigest({
        shipped: [],
        changed: [],
        unstable: [],
        leftOff: [],
      }),
      opts,
    );
    expect(out).not.toContain("Shipped");
    expect(out).not.toContain("Changed");
    expect(out).not.toContain("Still Shifting");
    expect(out).not.toContain("Left Off");
    // Vibe + takeaways should still render
    expect(out).toContain("Vibe Check");
    expect(out).toContain("Key Takeaways");
  });

  it("always renders the -lines half of the stats line, even when 0", () => {
    // Mirrors web parity — DigestView.tsx:83 always shows both halves.
    setRich();
    const out = formatDigest(
      makeDigest({
        stats: {
          commits: 3,
          filesChanged: 2,
          linesAdded: 50,
          linesRemoved: 0,
          timeSpan: { from: new Date(), to: new Date() },
        },
      }),
      opts,
    );
    expect(out).toContain("+50 lines");
    expect(out).toContain("-0 lines");
  });

  it("uses bracketed plain headers in NO_COLOR / non-TTY mode", () => {
    setPlain();
    const out = formatDigest(makeDigest(), opts);
    expect(out).toContain("[Vibe Check]");
    expect(out).toContain("[Shipped]");
    expect(out).toContain("[Changed]");
    expect(out).toContain("[Still Shifting]");
    expect(out).toContain("[Left Off]");
    expect(out).toContain("[Key Takeaways]");
  });

  it("uses the rich separator in TTY mode and the plain pipe in non-TTY", () => {
    setRich();
    const rich = formatDigest(makeDigest(), opts);
    expect(rich).toContain(" · ");

    setPlain();
    const plain = formatDigest(makeDigest(), opts);
    expect(plain).toContain(" | ");
    expect(plain).not.toContain(" · ");
  });

  it("uses ASCII bullet in plain mode, unicode bullet in rich", () => {
    setRich();
    expect(formatDigest(makeDigest(), opts)).toContain("• ");
    setPlain();
    expect(formatDigest(makeDigest(), opts)).toContain("- ");
  });
});

// =====================================================================
// formatCodebaseHealth
// =====================================================================

describe("formatCodebaseHealth", () => {
  const commit = (filesChanged: string[], adds = 0, dels = 0): GitCommit => ({
    hash: "abc1234",
    message: "wip",
    author: "test",
    timestamp: new Date(),
    filesChanged,
    additions: adds,
    deletions: dels,
  });

  it("renders the Most Active Files block as a numbered list with per-file +/-", () => {
    const commits: GitCommit[] = [
      commit(["src/foo.ts"], 10, 5),
      commit(["src/foo.ts", "src/bar.ts"], 4, 1),
      commit(["src/foo.ts"], 6, 0),
    ];
    const diffs: GitDiff[] = [
      { file: "src/foo.ts", additions: 20, deletions: 5, patch: "" },
      { file: "src/bar.ts", additions: 4, deletions: 1, patch: "" },
    ];
    const out = formatCodebaseHealth(commits, diffs);
    expect(out).toContain("Most Active Files");
    expect(out).toContain("1. src/foo.ts (+20 / -5, 3 commits)");
    expect(out).toContain("2. src/bar.ts (+4 / -1, 1 commit)");
  });

  it("falls back to (0 / 0) when diffs aren't supplied", () => {
    const commits: GitCommit[] = [
      commit(["src/foo.ts"]),
      commit(["src/foo.ts"]),
      commit(["src/foo.ts"]),
    ];
    const out = formatCodebaseHealth(commits);
    expect(out).toContain("1. src/foo.ts (+0 / -0, 3 commits)");
  });

  it("handles singular vs plural commit count per file", () => {
    const commits: GitCommit[] = [commit(["src/foo.ts"])];
    const diffs: GitDiff[] = [{ file: "src/foo.ts", additions: 1, deletions: 0, patch: "" }];
    const out = formatCodebaseHealth(commits, diffs);
    expect(out).toContain("1 commit"); // singular
    expect(out).not.toMatch(/1 commits/);
  });

  it("uses the 'files touched per commit' wording in the Focus row", () => {
    const commits: GitCommit[] = [commit(["a.ts", "b.ts"], 1, 0), commit(["a.ts"], 1, 0)];
    const out = formatCodebaseHealth(commits);
    expect(out).toContain("files touched per commit");
  });

  it("classifies a balanced small change as Lean / Tight / Clean", () => {
    // 1 file, 1 commit, no churn, balanced add/remove (ratio = 2 → Lean band).
    // Note: when totalRemoved=0 the ratio collapses to 99 (Ballooning), so
    // a true "Lean" reading requires actual removals proportional to adds.
    const commits: GitCommit[] = [commit(["src/x.ts"], 6, 3)];
    const out = formatCodebaseHealth(commits);
    expect(out).toContain("Lean"); // ratio 2.0 → Lean band (≤3)
    expect(out).toContain("Tight"); // 1 file/commit
    expect(out).toContain("Clean"); // 0 churn files
  });

  it("collapses growth ratio to Ballooning when removals are zero (no balance)", () => {
    // Documents a real edge case: a pure add-only commit reads as
    // 'Ballooning', because the ratio guard sets it to 99 when
    // totalRemoved = 0. Reflects the real signal — net growth without
    // any housekeeping looks worse than balanced growth.
    const commits: GitCommit[] = [commit(["src/x.ts"], 5, 0)];
    const out = formatCodebaseHealth(commits);
    expect(out).toContain("Ballooning");
  });

  it("flags Heavy growth when adds vastly outweigh removals", () => {
    const commits: GitCommit[] = [commit(["src/x.ts"], 1000, 25)];
    const out = formatCodebaseHealth(commits);
    expect(out).toContain("Heavy"); // ratio 40 → Heavy band
  });

  it("flags High churn when many files are reworked 3+ times each", () => {
    const repeat = (file: string) => Array.from({ length: 4 }, () => commit([file]));
    const commits: GitCommit[] = [
      ...repeat("src/a.ts"),
      ...repeat("src/b.ts"),
      ...repeat("src/c.ts"),
      ...repeat("src/d.ts"),
      ...repeat("src/e.ts"),
      ...repeat("src/f.ts"),
      ...repeat("src/g.ts"),
      ...repeat("src/h.ts"),
      ...repeat("src/i.ts"),
      ...repeat("src/j.ts"),
      ...repeat("src/k.ts"),
      ...repeat("src/l.ts"),
      ...repeat("src/m.ts"),
    ];
    const out = formatCodebaseHealth(commits);
    expect(out).toContain("High");
  });

  it("only counts files reworked 3+ times as churn", () => {
    // File touched twice should NOT count
    const commits: GitCommit[] = [commit(["a.ts"], 1, 0), commit(["a.ts"], 1, 0)];
    const out = formatCodebaseHealth(commits);
    expect(out).toContain("Clean"); // 0 churn files
  });

  it("does not render Most Active Files when there are no commits", () => {
    const out = formatCodebaseHealth([]);
    expect(out).not.toContain("Most Active Files");
    expect(out).toContain("Codebase Health"); // still shows health block
  });
});

// =====================================================================
// formatCodingTimeline
// =====================================================================

describe("formatCodingTimeline", () => {
  it("returns an empty string for an empty commit list", () => {
    expect(formatCodingTimeline([])).toBe("");
  });

  it("returns an empty string when every timestamp is invalid", () => {
    expect(formatCodingTimeline([{ timestamp: "not a date" }])).toBe("");
  });

  it("renders a single commit as one time, '1 commit'", () => {
    setRich();
    const out = formatCodingTimeline([{ timestamp: new Date("2026-04-30T15:30:00") }]);
    expect(out).toContain("Coding Timeline");
    // Lowercase per web parity
    expect(out).toMatch(/3:30 (am|pm).*·.*1 commit/);
    expect(out).not.toMatch(/1 commits/);
  });

  it("renders a range with 'to' separator and the right total", () => {
    setRich();
    const out = formatCodingTimeline([
      { timestamp: new Date("2026-04-30T09:14:00") },
      { timestamp: new Date("2026-04-30T12:30:00") },
      { timestamp: new Date("2026-04-30T16:30:00") },
    ]);
    expect(out).toMatch(/9:14 (am|pm) to 4:30 (am|pm)/);
    expect(out).toContain("3 commits");
  });

  it("collapses the range to a single time when start === end", () => {
    setRich();
    const t = new Date("2026-04-30T15:30:00");
    const out = formatCodingTimeline([{ timestamp: t }, { timestamp: t }]);
    expect(out).not.toContain(" to ");
    expect(out).toContain("2 commits");
  });

  it("accepts ISO strings in addition to Date objects", () => {
    setRich();
    const out = formatCodingTimeline([
      { timestamp: "2026-04-30T09:00:00" },
      { timestamp: "2026-04-30T17:00:00" },
    ]);
    expect(out).toContain("Coding Timeline");
    expect(out).toContain("2 commits");
  });

  it("filters out NaN timestamps but keeps valid ones", () => {
    setRich();
    const out = formatCodingTimeline([
      { timestamp: "garbage" },
      { timestamp: new Date("2026-04-30T10:00:00") },
      { timestamp: new Date("2026-04-30T11:00:00") },
    ]);
    expect(out).toContain("2 commits");
  });

  it("uses a plain header (no emoji) in both rich and plain modes", () => {
    setRich();
    expect(formatCodingTimeline([{ timestamp: new Date() }])).toMatch(/^Coding Timeline\n/);
    setPlain();
    expect(formatCodingTimeline([{ timestamp: new Date() }])).toMatch(/^Coding Timeline\n/);
  });

  it("uses the right separator between range and count for each mode", () => {
    const commits = [{ timestamp: new Date("2026-04-30T10:00:00") }];
    setRich();
    expect(formatCodingTimeline(commits)).toContain(" · 1 commit");
    setPlain();
    expect(formatCodingTimeline(commits)).toContain(" | 1 commit");
  });
});

// =====================================================================
// formatPaceCheck
// =====================================================================

describe("formatPaceCheck", () => {
  const history = (...counts: number[]): DigestRunSummary[] =>
    counts.map((commits, i) => ({
      runAt: `2026-04-${String(20 + i).padStart(2, "0")}T00:00:00.000Z`,
      commits,
    }));

  it("returns empty string when fewer than 3 prior runs", () => {
    expect(formatPaceCheck({ todayCommits: 5, history: [] })).toBe("");
    expect(formatPaceCheck({ todayCommits: 5, history: history(2, 3) })).toBe("");
  });

  it("returns empty string when average commits = 0", () => {
    expect(formatPaceCheck({ todayCommits: 5, history: history(0, 0, 0) })).toBe("");
  });

  it("computes multiplier from the most recent 3 entries", () => {
    // History has more than 3 — only the last 3 matter (avg = (4+5+9)/3 = 6).
    // Today = 12 → multiplier = 12/6 = 2.0
    const out = formatPaceCheck({
      todayCommits: 12,
      history: history(99, 99, 4, 5, 9),
    });
    expect(out).toContain("2x");
  });

  it("renders the band-appropriate label (>=2.0)", () => {
    const out = formatPaceCheck({ todayCommits: 14, history: history(7, 7, 7) });
    expect(out).toContain("Twice your usual pace");
  });

  it("renders the band-appropriate label (>=1.3)", () => {
    const out = formatPaceCheck({ todayCommits: 10, history: history(7, 7, 7) });
    expect(out).toContain("A little faster than usual");
  });

  it("renders the band-appropriate label (>=0.8, in-groove)", () => {
    const out = formatPaceCheck({ todayCommits: 7, history: history(7, 7, 7) });
    expect(out).toContain("Right in your groove");
  });

  it("renders the band-appropriate label (<0.5, quiet)", () => {
    const out = formatPaceCheck({ todayCommits: 1, history: history(10, 10, 10) });
    expect(out).toContain("Quiet one");
  });

  it("renders 'commits today' and hyphenated 'N-commit avg'", () => {
    const out = formatPaceCheck({ todayCommits: 12, history: history(7, 7, 7) });
    expect(out).toContain("12 commits today");
    expect(out).toContain("7-commit avg"); // hyphen is the web-parity form
  });

  it("uses a plain 'Pace Check' header (no emoji) in both modes", () => {
    setRich();
    expect(formatPaceCheck({ todayCommits: 10, history: history(7, 7, 7) })).toMatch(
      /^Pace Check\n/,
    );
    setPlain();
    expect(formatPaceCheck({ todayCommits: 10, history: history(7, 7, 7) })).toMatch(
      /^Pace Check\n/,
    );
  });
});

// =====================================================================
// formatResume
// =====================================================================

describe("formatResume", () => {
  it("renders all sections when present", () => {
    const out = formatResume(
      makeDigest({
        resumeContext: {
          techStack: "TS",
          recentWork: "Refactors",
          currentFocus: "Tests",
          keyFiles: ["a.ts", "b.ts"],
          warnings: ["Don't break the API"],
        },
      }),
    );
    expect(out.prompt).toContain("Tech Stack");
    expect(out.prompt).toContain("Recent Work");
    expect(out.prompt).toContain("Current Focus");
    expect(out.prompt).toContain("Key Files");
    expect(out.prompt).toContain("Heads Up");
    expect(out.prompt).toContain("a.ts");
    expect(out.prompt).toContain("Don't break the API");
  });

  it("skips empty sections", () => {
    const out = formatResume(
      makeDigest({
        resumeContext: {
          techStack: "TS",
          recentWork: "",
          currentFocus: "",
          keyFiles: [],
          warnings: [],
        },
      }),
    );
    expect(out.prompt).toContain("Tech Stack");
    expect(out.prompt).not.toContain("Recent Work");
    expect(out.prompt).not.toContain("Current Focus");
    expect(out.prompt).not.toContain("Key Files");
    expect(out.prompt).not.toContain("Heads Up");
  });

  it("returns an empty prompt when nothing is set", () => {
    const out = formatResume(
      makeDigest({
        resumeContext: {
          techStack: "",
          recentWork: "",
          currentFocus: "",
          keyFiles: [],
          warnings: [],
        },
      }),
    );
    expect(out.prompt).toBe("");
  });
});

// =====================================================================
// formatStandup
// =====================================================================

describe("formatStandup", () => {
  it("uses standupNotes when each section is populated", () => {
    const out = formatStandup(
      makeDigest({
        standupNotes: {
          yesterday: ["did a thing"],
          today: ["doing another"],
          blockers: ["nothing"],
        },
      }),
    );
    expect(out.yesterday).toEqual(["did a thing"]);
    expect(out.today).toEqual(["doing another"]);
    expect(out.blockers).toEqual(["nothing"]);
  });

  it("falls back to digest sections when standupNotes are empty", () => {
    const out = formatStandup(
      makeDigest({
        standupNotes: { yesterday: [], today: [], blockers: [] },
        shipped: [{ summary: "shipped A" }],
        leftOff: [{ summary: "mid-flow B" }],
        unstable: [{ summary: "wobbly C", changeCount: 4 }],
      }),
    );
    expect(out.yesterday).toEqual(["shipped A"]);
    expect(out.today).toEqual(["mid-flow B"]);
    expect(out.blockers).toEqual(["wobbly C"]);
  });

  it("falls back per-field independently — empty yesterday but populated today/blockers stays partial", () => {
    const out = formatStandup(
      makeDigest({
        standupNotes: {
          yesterday: [],
          today: ["today A"],
          blockers: ["blocker B"],
        },
        shipped: [{ summary: "shipped fallback" }],
      }),
    );
    expect(out.yesterday).toEqual(["shipped fallback"]);
    expect(out.today).toEqual(["today A"]);
    expect(out.blockers).toEqual(["blocker B"]);
  });
});
