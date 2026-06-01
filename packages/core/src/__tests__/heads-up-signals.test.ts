import { describe, it, expect } from "vitest";
import {
  extractTodosFromDiffs,
  extractFlaggedCommits,
  formatHeadsUpSignalsBlock,
} from "../heads-up-signals.js";
import type { GitCommit, GitDiff } from "../types.js";

/**
 * Helper to build a minimal GitDiff with just the patch field used
 * by the extractor. The other fields are present for type
 * conformance but the function only reads .file and .patch.
 */
function makeDiff(file: string, patch: string): GitDiff {
  return { file, additions: 0, deletions: 0, patch };
}

/**
 * Helper to build a minimal GitCommit with just the subject + line
 * counts used by the flagger.
 */
function makeCommit(
  message: string,
  additions = 0,
  deletions = 0,
  hash = "abcdef1234567890",
): GitCommit {
  return {
    hash,
    message,
    author: "Test",
    timestamp: new Date("2026-01-01T00:00:00Z"),
    filesChanged: [],
    additions,
    deletions,
  };
}

describe("extractTodosFromDiffs", () => {
  it("returns empty array for empty input", () => {
    expect(extractTodosFromDiffs([])).toEqual([]);
  });

  it("returns empty array for a diff with no patch text", () => {
    expect(extractTodosFromDiffs([makeDiff("a.ts", "")])).toEqual([]);
  });

  it("extracts a JS-style // TODO added on a + line", () => {
    const patch = [
      "@@ -1,2 +1,3 @@",
      " export function foo() {",
      "+  // TODO: handle the empty case",
      "   return 1;",
    ].join("\n");
    const out = extractTodosFromDiffs([makeDiff("foo.ts", patch)]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      file: "foo.ts",
      marker: "TODO",
      text: "handle the empty case",
    });
    // Hunk starts at line 1, "+TODO" is the 2nd visible line in the
    // post-change file, so the TODO sits at line 2.
    expect(out[0]?.line).toBe(2);
  });

  it("extracts a # FIXME added on a + line (Python-style)", () => {
    const patch = ["@@ -10,1 +10,2 @@", " def foo():", "+    # FIXME: broken on Windows"].join(
      "\n",
    );
    const out = extractTodosFromDiffs([makeDiff("foo.py", patch)]);
    expect(out).toHaveLength(1);
    expect(out[0]?.marker).toBe("FIXME");
    expect(out[0]?.text).toBe("broken on Windows");
  });

  it("extracts /* HACK */ block-comment style", () => {
    const patch = ["@@ -1,1 +1,2 @@", " var x = 1;", "+/* HACK: temporary workaround */"].join(
      "\n",
    );
    const out = extractTodosFromDiffs([makeDiff("foo.c", patch)]);
    expect(out).toHaveLength(1);
    expect(out[0]?.marker).toBe("HACK");
    expect(out[0]?.text).toBe("temporary workaround");
  });

  it("does NOT extract a bare 'TODO' string literal (not in a comment)", () => {
    const patch = ["@@ -1,1 +1,2 @@", " var x;", "+const status = 'TODO';"].join("\n");
    expect(extractTodosFromDiffs([makeDiff("foo.ts", patch)])).toEqual([]);
  });

  it("does NOT extract TODOs that appear only on - (removed) lines", () => {
    const patch = ["@@ -1,2 +1,1 @@", "-  // TODO: old comment", " export const x = 1;"].join("\n");
    expect(extractTodosFromDiffs([makeDiff("foo.ts", patch)])).toEqual([]);
  });

  it("caps results at MAX_TODOS (5)", () => {
    // Build a patch that adds 8 TODOs — we expect exactly 5 back.
    const lines = ["@@ -0,0 +1,8 @@"];
    for (let i = 1; i <= 8; i++) {
      lines.push(`+  // TODO: item ${i}`);
    }
    const out = extractTodosFromDiffs([makeDiff("many.ts", lines.join("\n"))]);
    expect(out).toHaveLength(5);
  });

  it("tracks line numbers correctly across multiple hunks", () => {
    const patch = [
      "@@ -1,1 +1,2 @@",
      " line one",
      "+  // TODO: first",
      "@@ -10,1 +10,2 @@",
      " line ten",
      "+  // TODO: second",
    ].join("\n");
    const out = extractTodosFromDiffs([makeDiff("foo.ts", patch)]);
    expect(out).toHaveLength(2);
    // First hunk starts at line 1; "+TODO" is the 2nd visible line → 2
    expect(out[0]?.line).toBe(2);
    // Second hunk starts at line 10; "+TODO" is the 2nd visible line there → 11
    expect(out[1]?.line).toBe(11);
  });
});

describe("extractFlaggedCommits", () => {
  it("returns empty array for empty input", () => {
    expect(extractFlaggedCommits([])).toEqual([]);
  });

  it("flags 'wip' subject as reason: wip", () => {
    const out = extractFlaggedCommits([makeCommit("wip: refactor auth")]);
    expect(out).toHaveLength(1);
    expect(out[0]?.reason).toBe("wip");
  });

  it("flags 'still broken' subject as reason: broken", () => {
    const out = extractFlaggedCommits([makeCommit("still broken on Safari")]);
    expect(out).toHaveLength(1);
    expect(out[0]?.reason).toBe("broken");
  });

  it("flags 'hack' / 'kludge' subjects as reason: hack", () => {
    const a = extractFlaggedCommits([makeCommit("hack around test runner bug")]);
    expect(a[0]?.reason).toBe("hack");
    const b = extractFlaggedCommits([makeCommit("kludge to ship today")]);
    expect(b[0]?.reason).toBe("hack");
  });

  it("does NOT flag a tiny 'fix: typo' commit (under the 50-line threshold)", () => {
    expect(extractFlaggedCommits([makeCommit("fix: typo in README", 1, 1)])).toEqual([]);
  });

  it("flags a large fix commit as reason: fix-uncertain", () => {
    // 50 added + 0 deleted hits the >=50 threshold exactly.
    const out = extractFlaggedCommits([makeCommit("fix: race condition in worker", 50, 0)]);
    expect(out).toHaveLength(1);
    expect(out[0]?.reason).toBe("fix-uncertain");
  });

  it("does NOT flag a normal feature commit", () => {
    expect(extractFlaggedCommits([makeCommit("Add billing flow", 200, 50)])).toEqual([]);
  });

  it("caps results at 5 even when more would match", () => {
    const commits = Array.from({ length: 8 }, (_, i) =>
      makeCommit(`wip: piece ${i + 1}`, 0, 0, `hash${i}aaaaaaaaaaaaaa`),
    );
    expect(extractFlaggedCommits(commits)).toHaveLength(5);
  });

  it("returns shortHash as the first 7 chars of the full hash", () => {
    const out = extractFlaggedCommits([
      makeCommit("wip: thing", 0, 0, "1234567890abcdef1234567890"),
    ]);
    expect(out[0]?.shortHash).toBe("1234567");
  });
});

describe("formatHeadsUpSignalsBlock", () => {
  // The exact prose this function emits is part of the LLM prompt
  // contract — too fragile to assert verbatim. Instead, lock in the
  // two structural invariants the prompt depends on.
  it("always returns a non-empty block (the prompt counts on its presence)", () => {
    expect(formatHeadsUpSignalsBlock([], []).length).toBeGreaterThan(0);
  });

  it("renders todos with file path and line number when signals are present", () => {
    const block = formatHeadsUpSignalsBlock(
      [{ file: "src/auth.ts", line: 42, marker: "TODO", text: "wire up SSO" }],
      [],
    );
    expect(block).toContain("src/auth.ts");
    expect(block).toContain("42");
    expect(block).toContain("wire up SSO");
  });

  it("renders flagged commits with the short hash and verbatim subject", () => {
    const block = formatHeadsUpSignalsBlock(
      [],
      [
        {
          hash: "abc1234deadbeef",
          shortHash: "abc1234",
          message: "wip: half-done",
          reason: "wip",
        },
      ],
    );
    expect(block).toContain("abc1234");
    expect(block).toContain("wip: half-done");
  });
});
