import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { getCommits, getDiffs, getRepoName, getParentSha } from "../git.js";

const execFileAsync = promisify(execFile);

/**
 * Tests against git.ts run inside a real, ephemeral git repo per
 * test. Cheaper than mocking child_process and confirms the actual
 * git binary's output shape is the one git.ts parses.
 *
 * Each test:
 *   - mkdtemp + `git init`
 *   - configure local user.name + user.email (CI envs often lack
 *     these; without them `git commit` fails)
 *   - create + commit fixture file(s)
 *   - exercise the public API
 *
 * If the host doesn't have git on PATH the tests will fail fast
 * with a clear error from execFile rather than producing
 * misleading results, which matches what real users would see.
 */
async function gitInit(dir: string): Promise<void> {
  await execFileAsync("git", ["init", "-q", "-b", "main"], { cwd: dir });
  // Local config so commit() doesn't require global git setup.
  await execFileAsync("git", ["config", "user.email", "test@askscout.dev"], { cwd: dir });
  await execFileAsync("git", ["config", "user.name", "Askscout Test"], { cwd: dir });
}

async function commit(dir: string, file: string, content: string, msg: string): Promise<void> {
  await fs.writeFile(path.join(dir, file), content);
  await execFileAsync("git", ["add", file], { cwd: dir });
  await execFileAsync("git", ["commit", "-q", "-m", msg], { cwd: dir });
}

describe("getRepoName", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "askscout-git-name-"));
    await gitInit(dir);
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("parses HTTPS origin URLs (https://github.com/owner/repo.git)", async () => {
    await execFileAsync(
      "git",
      ["remote", "add", "origin", "https://github.com/charleshonig5/askscout.git"],
      { cwd: dir },
    );
    expect(await getRepoName(dir)).toBe("charleshonig5/askscout");
  });

  it("parses SSH origin URLs (git@github.com:owner/repo.git)", async () => {
    await execFileAsync(
      "git",
      ["remote", "add", "origin", "git@github.com:charleshonig5/askscout.git"],
      { cwd: dir },
    );
    expect(await getRepoName(dir)).toBe("charleshonig5/askscout");
  });

  it("parses HTTPS URLs without the .git suffix", async () => {
    await execFileAsync(
      "git",
      ["remote", "add", "origin", "https://gitlab.com/myorg/myrepo"],
      { cwd: dir },
    );
    expect(await getRepoName(dir)).toBe("myorg/myrepo");
  });

  it("falls back to the directory basename when no remote is configured", async () => {
    // No `git remote add` — origin is absent.
    const expected = path.basename(dir);
    expect(await getRepoName(dir)).toBe(expected);
  });
});

describe("getCommits + getDiffs (integration with a real git repo)", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "askscout-git-log-"));
    await gitInit(dir);
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("returns [] when the repo has no commits in the time range", async () => {
    await commit(dir, "a.txt", "v1\n", "add a.txt");
    // since = now + 1h, so the commit just made falls outside the window
    const future = new Date(Date.now() + 60 * 60 * 1000);
    expect(await getCommits(dir, future)).toEqual([]);
  });

  it("reads every commit in the window with the right messages", async () => {
    // Note on ordering: three commits made back-to-back share an
    // identical seconds-resolution timestamp from git, so a strict
    // chronological assertion would be flaky (stable-sort under
    // tied timestamps preserves git's native newest-first order).
    // The real contract here is "all in-window commits returned" —
    // chronological order is best-effort and the production case
    // (commits seconds or minutes apart) holds it cleanly.
    await commit(dir, "a.txt", "v1\n", "add a.txt");
    await commit(dir, "b.txt", "v1\n", "add b.txt");
    await commit(dir, "c.txt", "v1\n", "add c.txt");
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const commits = await getCommits(dir, since);
    expect(commits).toHaveLength(3);
    expect(new Set(commits.map((c) => c.message))).toEqual(
      new Set(["add a.txt", "add b.txt", "add c.txt"]),
    );
  });

  it("populates additions/deletions/filesChanged on each commit", async () => {
    await commit(dir, "a.txt", "line one\nline two\nline three\n", "add a.txt");
    const commits = await getCommits(dir, new Date(Date.now() - 60 * 60 * 1000));
    expect(commits).toHaveLength(1);
    expect(commits[0]?.additions).toBe(3);
    expect(commits[0]?.deletions).toBe(0);
    expect(commits[0]?.filesChanged).toEqual(["a.txt"]);
  });

  it("handles the initial commit correctly when computing diffs (uses EMPTY_TREE base)", async () => {
    // First commit has no parent — git.ts falls back to the empty
    // tree SHA to produce a meaningful diff. Without that handling
    // the diff call would error and getDiffs would return [].
    await commit(dir, "a.txt", "first content\n", "initial commit");
    const commits = await getCommits(dir, new Date(Date.now() - 60 * 60 * 1000));
    const diffs = await getDiffs(dir, commits);
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.file).toBe("a.txt");
    expect(diffs[0]?.patch).toContain("first content");
  });

  it("returns [] from getDiffs when given an empty commit list", async () => {
    expect(await getDiffs(dir, [])).toEqual([]);
  });
});

describe("getParentSha", () => {
  let dir: string;

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "askscout-git-parent-"));
    await gitInit(dir);
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it("returns the parent SHA for a commit that has one", async () => {
    await commit(dir, "a.txt", "v1\n", "first");
    await commit(dir, "a.txt", "v2\n", "second");
    const { stdout: headSha } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: dir });
    const { stdout: parentSha } = await execFileAsync("git", ["rev-parse", "HEAD~1"], {
      cwd: dir,
    });
    const got = await getParentSha(dir, headSha.trim());
    expect(got).toBe(parentSha.trim());
  });

  it("returns null for the initial commit (no parent)", async () => {
    await commit(dir, "a.txt", "v1\n", "initial");
    const { stdout: headSha } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: dir });
    expect(await getParentSha(dir, headSha.trim())).toBeNull();
  });
});
