import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { appendDigestRun, readState, writeState, STATE_HISTORY_CAP } from "../state.js";
import type { DigestRunSummary, ProjectState } from "../types.js";

/**
 * Tests for `state.ts` — the .askscout/state.json reader/writer.
 *
 * Covers:
 *   - readState: missing file → null
 *   - readState: corrupt JSON → warn + null (validator rejects)
 *   - readState: invalid shape → warn + null
 *   - readState: v1 file (no digestHistory) → defaults the field to []
 *   - readState: v2 file → returns full state
 *   - readState: corrupt entries inside digestHistory → drops them, keeps the rest
 *   - readState: digestHistory longer than STATE_HISTORY_CAP → truncated to last N
 *   - writeState → readState round-trip
 *   - appendDigestRun: adds entry, caps at STATE_HISTORY_CAP
 *
 * Each test gets a fresh tmp dir so they don't fight over shared state.
 */

let tmpRoot: string;
let originalWarn: typeof console.warn;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "askscout-state-test-"));
  // Suppress the warning console.warn writes for corrupt/invalid files —
  // we're deliberately exercising those paths and don't want the test
  // output cluttered.
  originalWarn = console.warn;
  console.warn = vi.fn();
});

afterEach(async () => {
  console.warn = originalWarn;
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

async function writeRaw(content: string): Promise<void> {
  const dir = path.join(tmpRoot, ".askscout");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "state.json"), content, "utf-8");
}

describe("readState", () => {
  it("returns null when state file doesn't exist", async () => {
    const result = await readState(tmpRoot);
    expect(result).toBeNull();
  });

  it("returns null and warns when state file is not valid JSON", async () => {
    await writeRaw("this is not json {{{");
    const result = await readState(tmpRoot);
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });

  it("returns null and warns when state file fails shape validation", async () => {
    // Missing required `summary` field → validator should reject
    await writeRaw(JSON.stringify({ version: 2, lastRunAt: "x", runCount: 0 }));
    const result = await readState(tmpRoot);
    expect(result).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });

  it("reads a v1 file and defaults digestHistory to empty array", async () => {
    // v1 file: no digestHistory field
    const v1: Omit<ProjectState, "digestHistory"> = {
      version: 1,
      lastRunAt: "2026-01-01T00:00:00.000Z",
      runCount: 5,
      summary: "Some project context",
    };
    await writeRaw(JSON.stringify(v1));
    const result = await readState(tmpRoot);
    expect(result).not.toBeNull();
    expect(result!.version).toBe(1);
    expect(result!.runCount).toBe(5);
    expect(result!.summary).toBe("Some project context");
    expect(result!.digestHistory).toEqual([]);
  });

  it("reads a v2 file with digestHistory intact", async () => {
    const history: DigestRunSummary[] = [
      { runAt: "2026-01-01T00:00:00.000Z", commits: 3 },
      { runAt: "2026-01-02T00:00:00.000Z", commits: 7 },
    ];
    const v2: ProjectState = {
      version: 2,
      lastRunAt: "2026-01-02T00:00:00.000Z",
      runCount: 2,
      summary: "v2 state",
      digestHistory: history,
    };
    await writeRaw(JSON.stringify(v2));
    const result = await readState(tmpRoot);
    expect(result!.digestHistory).toEqual(history);
  });

  it("drops malformed entries from digestHistory but keeps the valid ones", async () => {
    // Mix of valid + various invalid shapes. normalizeDigestHistory should
    // skip the bad ones rather than tipping the whole read into "ignore."
    const v2 = {
      version: 2,
      lastRunAt: "2026-01-01T00:00:00.000Z",
      runCount: 1,
      summary: "mixed history",
      digestHistory: [
        { runAt: "2026-01-01T00:00:00.000Z", commits: 5 }, // valid
        { runAt: "2026-01-02T00:00:00.000Z" }, // missing commits
        { commits: 3 }, // missing runAt
        { runAt: "2026-01-04T00:00:00.000Z", commits: "ten" }, // wrong type
        null, // not an object
        { runAt: "2026-01-05T00:00:00.000Z", commits: 7 }, // valid
      ],
    };
    await writeRaw(JSON.stringify(v2));
    const result = await readState(tmpRoot);
    expect(result!.digestHistory).toEqual([
      { runAt: "2026-01-01T00:00:00.000Z", commits: 5 },
      { runAt: "2026-01-05T00:00:00.000Z", commits: 7 },
    ]);
  });

  it("truncates digestHistory to STATE_HISTORY_CAP when it's grown larger", async () => {
    // Older state files (or external edits) might have grown beyond the
    // cap. Re-cap on every read so memory doesn't keep climbing.
    const oversized = Array.from({ length: STATE_HISTORY_CAP + 5 }, (_, i) => ({
      runAt: `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
      commits: i,
    }));
    const v2 = {
      version: 2,
      lastRunAt: "2026-01-15T00:00:00.000Z",
      runCount: oversized.length,
      summary: "oversized history",
      digestHistory: oversized,
    };
    await writeRaw(JSON.stringify(v2));
    const result = await readState(tmpRoot);
    expect(result!.digestHistory.length).toBe(STATE_HISTORY_CAP);
    // Should keep the most recent entries (the last N by array order).
    expect(result!.digestHistory[0]!.commits).toBe(5);
    expect(result!.digestHistory[STATE_HISTORY_CAP - 1]!.commits).toBe(STATE_HISTORY_CAP + 4);
  });

  it("treats non-array digestHistory as empty rather than failing", async () => {
    // Defensive — if some external tool or hand-edit puts garbage here,
    // we degrade gracefully rather than refusing to read the whole file.
    const v2 = {
      version: 2,
      lastRunAt: "2026-01-01T00:00:00.000Z",
      runCount: 1,
      summary: "weird history field",
      digestHistory: "not an array",
    };
    await writeRaw(JSON.stringify(v2));
    const result = await readState(tmpRoot);
    expect(result!.digestHistory).toEqual([]);
  });
});

describe("writeState", () => {
  it("creates the .askscout directory if missing and writes JSON", async () => {
    const state: ProjectState = {
      version: 2,
      lastRunAt: "2026-04-30T12:00:00.000Z",
      runCount: 1,
      summary: "fresh write",
      digestHistory: [{ runAt: "2026-04-30T12:00:00.000Z", commits: 4 }],
    };
    await writeState(tmpRoot, state);
    const filePath = path.join(tmpRoot, ".askscout", "state.json");
    const onDisk = await fs.readFile(filePath, "utf-8");
    expect(JSON.parse(onDisk)).toEqual(state);
  });

  it("round-trips through readState without losing data", async () => {
    const state: ProjectState = {
      version: 2,
      lastRunAt: "2026-04-30T12:00:00.000Z",
      runCount: 3,
      summary: "round-trip check",
      digestHistory: [
        { runAt: "2026-04-28T12:00:00.000Z", commits: 2 },
        { runAt: "2026-04-29T12:00:00.000Z", commits: 5 },
        { runAt: "2026-04-30T12:00:00.000Z", commits: 8 },
      ],
    };
    await writeState(tmpRoot, state);
    const result = await readState(tmpRoot);
    expect(result).toEqual(state);
  });
});

describe("appendDigestRun", () => {
  it("appends a new run to an empty history", () => {
    const result = appendDigestRun([], { runAt: "2026-04-30T00:00:00.000Z", commits: 5 });
    expect(result).toEqual([{ runAt: "2026-04-30T00:00:00.000Z", commits: 5 }]);
  });

  it("appends to a non-empty history in order", () => {
    const existing: DigestRunSummary[] = [{ runAt: "2026-04-29T00:00:00.000Z", commits: 3 }];
    const result = appendDigestRun(existing, { runAt: "2026-04-30T00:00:00.000Z", commits: 5 });
    expect(result).toEqual([
      { runAt: "2026-04-29T00:00:00.000Z", commits: 3 },
      { runAt: "2026-04-30T00:00:00.000Z", commits: 5 },
    ]);
  });

  it("caps at STATE_HISTORY_CAP, dropping oldest entries first", () => {
    const full = Array.from({ length: STATE_HISTORY_CAP }, (_, i) => ({
      runAt: `2026-04-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
      commits: i,
    }));
    const result = appendDigestRun(full, {
      runAt: "2026-05-01T00:00:00.000Z",
      commits: 99,
    });
    expect(result.length).toBe(STATE_HISTORY_CAP);
    // Oldest entry (commits: 0) should be dropped; newest (99) at the end.
    expect(result[0]!.commits).toBe(1);
    expect(result[STATE_HISTORY_CAP - 1]!.commits).toBe(99);
  });

  it("does not mutate the input array", () => {
    const existing: DigestRunSummary[] = [{ runAt: "2026-04-29T00:00:00.000Z", commits: 3 }];
    const before = [...existing];
    appendDigestRun(existing, { runAt: "2026-04-30T00:00:00.000Z", commits: 5 });
    expect(existing).toEqual(before);
  });
});
