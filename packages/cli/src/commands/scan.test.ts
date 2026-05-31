import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getSinceDate, formatTimeLabel, findProjectRoot } from "./scan";
import type { ProjectState } from "askscout-core";

/**
 * getSinceDate: maps (timeRange, state) to the cutoff date used as
 * `git log --since`. Edge cases matter — get this wrong and a user
 * either re-summarizes work they've already seen (lastRunAt too
 * recent) or loses days of activity (lastRunAt too old).
 */
describe("getSinceDate", () => {
  it("--week always returns ~7 days ago regardless of state", () => {
    const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const got = getSinceDate("week", null).getTime();
    // 1-second slop window covers wall-clock drift between the
    // function call and the assertion. Tighter than that risks
    // flakiness on slow CI.
    expect(got).toBeGreaterThanOrEqual(sevenDaysAgoMs - 1000);
    expect(got).toBeLessThanOrEqual(sevenDaysAgoMs + 1000);
  });

  it("auto with no state returns today (midnight, local)", () => {
    const got = getSinceDate("auto", null);
    const expected = new Date();
    expected.setHours(0, 0, 0, 0);
    expect(got.getTime()).toBe(expected.getTime());
  });

  it("auto with a recent lastRunAt returns that timestamp", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const state: ProjectState = {
      version: 2,
      lastRunAt: twoHoursAgo.toISOString(),
      runCount: 5,
      summary: null,
      digestHistory: [],
    };
    const got = getSinceDate("auto", state);
    expect(got.getTime()).toBe(twoHoursAgo.getTime());
  });

  it("auto with a stale (>30 days) lastRunAt falls back to today (midnight)", () => {
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
    const state: ProjectState = {
      version: 2,
      lastRunAt: fortyDaysAgo.toISOString(),
      runCount: 5,
      summary: null,
      digestHistory: [],
    };
    const got = getSinceDate("auto", state);
    const expected = new Date();
    expected.setHours(0, 0, 0, 0);
    expect(got.getTime()).toBe(expected.getTime());
  });

  it("auto with exactly 30-day-old lastRunAt still uses the timestamp", () => {
    // Boundary test — the cap is `<= 30 days`. Anything inclusive
    // of 30d should use the timestamp; only OLDER than 30d falls
    // back to today.
    const exactlyThirty = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 1000);
    const state: ProjectState = {
      version: 2,
      lastRunAt: exactlyThirty.toISOString(),
      runCount: 5,
      summary: null,
      digestHistory: [],
    };
    const got = getSinceDate("auto", state);
    expect(got.getTime()).toBe(exactlyThirty.getTime());
  });
});

/**
 * formatTimeLabel — the human-readable phrase rendered next to the
 * repo name in CLI output ("askscout · 12 commits · today"). Drives
 * the user's mental model of which window they're seeing.
 */
describe("formatTimeLabel", () => {
  it("returns 'today' when the since date is the same calendar day", () => {
    const sinceToday = new Date();
    sinceToday.setHours(0, 0, 0, 0);
    expect(formatTimeLabel(sinceToday)).toBe("today");
  });

  it("returns 'since yesterday' when the since date is yesterday's calendar day", () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    yest.setHours(8, 0, 0, 0);
    expect(formatTimeLabel(yest)).toBe("since yesterday");
  });

  it("returns 'past N days' when the since date is multiple days back", () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    expect(formatTimeLabel(sevenDaysAgo)).toMatch(/^past 7 days$/);
  });
});

/**
 * findProjectRoot walks up from cwd looking for .git. Use a tmp
 * dir to verify both the happy path (found at exact dir) and the
 * not-found path (throws). chdir is restored in afterEach so the
 * test process doesn't leak into other tests.
 */
describe("findProjectRoot", () => {
  let originalCwd: string;
  let tmpRoot: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "askscout-test-"));
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it("returns the directory containing .git when cwd is at the root", async () => {
    await fs.mkdir(path.join(tmpRoot, ".git"));
    process.chdir(tmpRoot);
    const got = await findProjectRoot();
    // Use realpathSync because macOS resolves /var → /private/var on
    // the cwd side but not on mkdtemp output (or vice versa) which
    // would otherwise make a string equality assertion flaky.
    expect(await fs.realpath(got)).toBe(await fs.realpath(tmpRoot));
  });

  it("walks up to find .git in a parent directory", async () => {
    await fs.mkdir(path.join(tmpRoot, ".git"));
    const deep = path.join(tmpRoot, "a", "b", "c");
    await fs.mkdir(deep, { recursive: true });
    process.chdir(deep);
    const got = await findProjectRoot();
    expect(await fs.realpath(got)).toBe(await fs.realpath(tmpRoot));
  });

  it("throws when no .git is found anywhere up the chain", async () => {
    // tmpRoot has no .git and lives in os.tmpdir() which (assuming
    // a sane CI / dev machine) has no .git above it either.
    process.chdir(tmpRoot);
    await expect(findProjectRoot()).rejects.toThrow(/Not a git repository/);
  });
});
