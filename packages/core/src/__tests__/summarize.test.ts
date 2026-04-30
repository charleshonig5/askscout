import { describe, expect, it } from "vitest";
import {
  buildAIContextSystemPrompt,
  buildStandupSystemPrompt,
  buildSystemPrompt,
  buildUnifiedSystemPrompt,
  buildUserPrompt,
  computeStats,
  formatCommitsForPrompt,
  formatDiffsForPrompt,
} from "../summarize.js";
import type { GitCommit, GitDiff, ProjectState } from "../types.js";

/**
 * Tests for `summarize.ts` — only the deterministic helpers.
 *
 * The actual `summarize()` function makes real LLM API calls and is
 * out of scope for unit tests; it's tested implicitly by the
 * deterministic functions it composes (prompt builders + stats).
 *
 * Covers:
 *   - All four system-prompt builders return non-empty strings with
 *     the expected structural markers (so future edits don't silently
 *     drop sections).
 *   - formatCommitsForPrompt: chronological ordering, short-hash
 *     truncation, time-prefixed format.
 *   - formatDiffsForPrompt: empty fallback, file-header structure.
 *   - buildUserPrompt: handles null state (first run) vs populated
 *     state, includes/excludes the health-instructions block based on
 *     runCount, surfaces churn data when files are repeat-touched.
 *   - computeStats: counts, line totals, time span boundaries, empty
 *     input edge case.
 */

const fixedDate = (iso: string) => new Date(iso);

const commit = (overrides: Partial<GitCommit> = {}): GitCommit => ({
  hash: "abcdef1234567890",
  message: "wip",
  author: "test",
  timestamp: fixedDate("2026-04-30T10:00:00Z"),
  filesChanged: ["src/foo.ts"],
  additions: 5,
  deletions: 1,
  ...overrides,
});

const diff = (overrides: Partial<GitDiff> = {}): GitDiff => ({
  file: "src/foo.ts",
  additions: 5,
  deletions: 1,
  patch: "@@ -1 +1 @@\n-old\n+new",
  ...overrides,
});

// =====================================================================
// System prompt builders
// =====================================================================

describe("buildSystemPrompt", () => {
  it("returns a non-empty string", () => {
    const out = buildSystemPrompt();
    expect(out).toBeTruthy();
    expect(out.length).toBeGreaterThan(100);
  });

  it("instructs to respond ONLY with valid JSON", () => {
    expect(buildSystemPrompt()).toMatch(/valid JSON/);
  });

  it("bans em dashes (Scout voice rule)", () => {
    expect(buildSystemPrompt()).toMatch(/em dashes/);
  });
});

describe("buildAIContextSystemPrompt", () => {
  it("includes all five output sections in order", () => {
    const out = buildAIContextSystemPrompt();
    const techStackIdx = out.indexOf("Tech Stack");
    const recentWorkIdx = out.indexOf("Recent Work");
    const currentFocusIdx = out.indexOf("Current Focus");
    const keyFilesIdx = out.indexOf("Key Files");
    const headsUpIdx = out.indexOf("Heads Up");
    expect(techStackIdx).toBeGreaterThan(-1);
    expect(recentWorkIdx).toBeGreaterThan(techStackIdx);
    expect(currentFocusIdx).toBeGreaterThan(recentWorkIdx);
    expect(keyFilesIdx).toBeGreaterThan(currentFocusIdx);
    expect(headsUpIdx).toBeGreaterThan(keyFilesIdx);
  });
});

describe("buildStandupSystemPrompt", () => {
  it("includes the three standup sections", () => {
    const out = buildStandupSystemPrompt();
    expect(out).toContain("Yesterday");
    expect(out).toContain("Today");
    expect(out).toContain("Blockers");
  });
});

describe("buildUnifiedSystemPrompt", () => {
  it("includes the section markers used by the streaming client to split outputs", () => {
    const out = buildUnifiedSystemPrompt();
    expect(out).toContain("---DIGEST---");
    expect(out).toContain("---STANDUP---");
    expect(out).toContain("---PLAN---");
    expect(out).toContain("---AI_CONTEXT---");
    expect(out).toContain("---SUMMARY---");
  });
});

// =====================================================================
// formatCommitsForPrompt
// =====================================================================

describe("formatCommitsForPrompt", () => {
  it("sorts commits chronologically (earliest first)", () => {
    const out = formatCommitsForPrompt([
      commit({
        hash: "later1234567",
        message: "second",
        timestamp: fixedDate("2026-04-30T15:00:00Z"),
      }),
      commit({
        hash: "early1234567",
        message: "first",
        timestamp: fixedDate("2026-04-30T09:00:00Z"),
      }),
    ]);
    const earlyIdx = out.indexOf("first");
    const lateIdx = out.indexOf("second");
    expect(earlyIdx).toBeGreaterThan(-1);
    expect(lateIdx).toBeGreaterThan(earlyIdx);
  });

  it("uses 7-character short hashes", () => {
    const out = formatCommitsForPrompt([commit({ hash: "deadbeef0123456789", message: "x" })]);
    expect(out).toContain("deadbee");
    // The full hash should NOT appear in full form anywhere
    expect(out).not.toContain("deadbeef0123456789");
  });

  it("numbers commits starting at 1", () => {
    const out = formatCommitsForPrompt([
      commit({ message: "a", timestamp: fixedDate("2026-04-30T09:00:00Z") }),
      commit({ message: "b", timestamp: fixedDate("2026-04-30T10:00:00Z") }),
    ]);
    expect(out).toMatch(/^1\.\s/);
    expect(out).toMatch(/\n2\.\s/);
  });

  it("does not mutate the input array order", () => {
    const a = commit({ message: "later", timestamp: fixedDate("2026-04-30T15:00:00Z") });
    const b = commit({ message: "earlier", timestamp: fixedDate("2026-04-30T09:00:00Z") });
    const input = [a, b];
    const before = [...input];
    formatCommitsForPrompt(input);
    expect(input).toEqual(before);
  });
});

// =====================================================================
// formatDiffsForPrompt
// =====================================================================

describe("formatDiffsForPrompt", () => {
  it("returns the no-diffs fallback for an empty array", () => {
    expect(formatDiffsForPrompt([])).toBe("No diffs available.");
  });

  it("renders each diff as a markdown file block with a fenced patch", () => {
    const out = formatDiffsForPrompt([
      diff({ file: "src/a.ts", patch: "@@ a @@" }),
      diff({ file: "src/b.ts", patch: "@@ b @@" }),
    ]);
    expect(out).toContain("### src/a.ts");
    expect(out).toContain("### src/b.ts");
    expect(out).toContain("@@ a @@");
    expect(out).toContain("@@ b @@");
    expect(out).toMatch(/```/); // fenced
  });
});

// =====================================================================
// buildUserPrompt
// =====================================================================

describe("buildUserPrompt", () => {
  it("uses the no-context fallback when state is null (first run)", () => {
    const out = buildUserPrompt([commit()], [diff()], null);
    expect(out).toContain("No previous context. This is the first run.");
  });

  it("uses the no-context fallback when state.summary is empty", () => {
    const state: ProjectState = {
      version: 2,
      lastRunAt: "2026-04-30T00:00:00.000Z",
      runCount: 1,
      summary: "",
      digestHistory: [],
    };
    const out = buildUserPrompt([commit()], [diff()], state);
    expect(out).toContain("No previous context. This is the first run.");
  });

  it("includes the project summary when state has one", () => {
    const state: ProjectState = {
      version: 2,
      lastRunAt: "2026-04-30T00:00:00.000Z",
      runCount: 5,
      summary: "Building a CLI for git digests.",
      digestHistory: [],
    };
    const out = buildUserPrompt([commit()], [diff()], state);
    expect(out).toContain("Building a CLI for git digests.");
  });

  it("instructs the LLM to set health=null on first run (state null)", () => {
    const out = buildUserPrompt([commit()], [diff()], null);
    expect(out).toContain('Set "health" to null');
  });

  it("requests health indicators once runCount >= 2 (i.e. this is run #3 or later)", () => {
    const state: ProjectState = {
      version: 2,
      lastRunAt: "2026-04-30T00:00:00.000Z",
      runCount: 2, // becomes run #3
      summary: "context",
      digestHistory: [],
    };
    const out = buildUserPrompt([commit()], [diff()], state);
    expect(out).toContain("run #3");
    expect(out).toContain("Momentum, Stability, and Focus");
  });

  it("surfaces churn data for files repeat-touched 3+ times", () => {
    const churnyCommits = Array.from({ length: 4 }, () => commit({ filesChanged: ["src/hot.ts"] }));
    const out = buildUserPrompt(churnyCommits, [diff({ file: "src/hot.ts" })], null);
    expect(out).toContain("src/hot.ts");
    expect(out).toContain("(4 commits)");
  });

  it("does not surface churn data for files touched fewer than 3 times", () => {
    // Two commits touching the same file → below the 3+ threshold
    const commits = [
      commit({ filesChanged: ["src/calm.ts"] }),
      commit({ filesChanged: ["src/calm.ts"] }),
    ];
    const out = buildUserPrompt(commits, [diff({ file: "src/calm.ts" })], null);
    // The churn list section should not include this file even though
    // it appears in the commit list elsewhere in the prompt.
    expect(out).not.toMatch(/src\/calm\.ts \(2 commits\)/);
  });
});

// =====================================================================
// computeStats
// =====================================================================

describe("computeStats", () => {
  it("returns zeros and a sensible time span for empty input", () => {
    const stats = computeStats([], []);
    expect(stats.commits).toBe(0);
    expect(stats.filesChanged).toBe(0);
    expect(stats.linesAdded).toBe(0);
    expect(stats.linesRemoved).toBe(0);
    // For empty input both bounds collapse to "now" — same instant.
    expect(stats.timeSpan.from.getTime()).toBe(stats.timeSpan.to.getTime());
  });

  it("counts commits, distinct files, and total lines correctly", () => {
    const commits: GitCommit[] = [
      commit({ hash: "a1234567" }),
      commit({ hash: "b1234567" }),
      commit({ hash: "c1234567" }),
    ];
    const diffs: GitDiff[] = [
      { file: "a.ts", additions: 10, deletions: 2, patch: "" },
      { file: "b.ts", additions: 5, deletions: 0, patch: "" },
      { file: "a.ts", additions: 3, deletions: 1, patch: "" }, // duplicate file
    ];
    const stats = computeStats(commits, diffs);
    expect(stats.commits).toBe(3);
    expect(stats.filesChanged).toBe(2); // distinct files
    expect(stats.linesAdded).toBe(18);
    expect(stats.linesRemoved).toBe(3);
  });

  it("computes time span as min/max of commit timestamps", () => {
    const earliest = fixedDate("2026-04-30T08:00:00Z");
    const latest = fixedDate("2026-04-30T18:00:00Z");
    const stats = computeStats(
      [
        commit({ timestamp: fixedDate("2026-04-30T12:00:00Z") }),
        commit({ timestamp: latest }),
        commit({ timestamp: earliest }),
      ],
      [],
    );
    expect(stats.timeSpan.from.getTime()).toBe(earliest.getTime());
    expect(stats.timeSpan.to.getTime()).toBe(latest.getTime());
  });

  it("collapses time span to a single point for one commit", () => {
    const t = fixedDate("2026-04-30T12:00:00Z");
    const stats = computeStats([commit({ timestamp: t })], []);
    expect(stats.timeSpan.from.getTime()).toBe(t.getTime());
    expect(stats.timeSpan.to.getTime()).toBe(t.getTime());
  });
});
