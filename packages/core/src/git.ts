import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { GitCommit, GitDiff } from "./types.js";

const execFileAsync = promisify(execFile);

// Use a record separator that cannot appear in git output:
// %x00 (NUL) is used as field delimiter, %x1e (RS) as record delimiter
const RECORD_SEP = "\x1e";
const MAX_DIFF_CHARS = 16_000; // ~4,000 tokens
const TRUNCATION_MARKER = "\n... (truncated)";

// Empty tree hash — used for diffing the initial commit
const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

async function execGit(projectRoot: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, {
    cwd: projectRoot,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}

function parseNumstatLine(
  line: string,
): { additions: number; deletions: number; file: string } | null {
  const match = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
  if (!match) return null;
  return {
    additions: match[1] === "-" ? 0 : Number(match[1]),
    deletions: match[2] === "-" ? 0 : Number(match[2]),
    file: match[3]!,
  };
}

/** Get the repo name from git remote, falling back to directory name */
export async function getRepoName(projectRoot: string): Promise<string> {
  try {
    const url = (await execGit(projectRoot, ["remote", "get-url", "origin"])).trim();
    // Parse owner/repo from URLs like:
    //   https://github.com/owner/repo.git
    //   git@github.com:owner/repo.git
    const match = url.match(/[/:]([^/]+\/[^/]+?)(?:\.git)?$/);
    if (match) return match[1]!;
  } catch {
    // no remote configured
  }
  // Fallback to directory name
  return projectRoot.split("/").pop() ?? "unknown";
}

/** Read commits from local git history within the given time range */
export async function getCommits(projectRoot: string, since: Date): Promise<GitCommit[]> {
  let stdout: string;
  try {
    stdout = await execGit(projectRoot, [
      "log",
      `--since=${since.toISOString()}`,
      `--format=%x1e%H%x00%s%x00%an%x00%aI`,
      "--numstat",
    ]);
  } catch (err) {
    // No commits or not a git repo
    if ((err as { code?: number }).code === 128) return [];
    throw err;
  }

  if (!stdout.trim()) return [];

  const blocks = stdout.split(RECORD_SEP).filter((b) => b.trim());
  const commits: GitCommit[] = [];

  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.length > 0);
    const headerLine = lines[0];
    if (!headerLine) continue;

    const parts = headerLine.split("\0");
    if (parts.length < 4) continue;

    const [hash, message, author, timestamp] = parts as [string, string, string, string];

    const filesChanged: string[] = [];
    let additions = 0;
    let deletions = 0;

    for (let i = 1; i < lines.length; i++) {
      const parsed = parseNumstatLine(lines[i]!);
      if (parsed) {
        filesChanged.push(parsed.file);
        additions += parsed.additions;
        deletions += parsed.deletions;
      }
    }

    commits.push({
      hash,
      message,
      author,
      timestamp: new Date(timestamp),
      filesChanged,
      additions,
      deletions,
    });
  }

  return commits.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/** Check if a commit has a parent */
async function hasParent(projectRoot: string, hash: string): Promise<boolean> {
  try {
    await execGit(projectRoot, ["rev-parse", "--verify", `${hash}^`]);
    return true;
  } catch {
    return false;
  }
}

/** Read diffs for the given commits */
export async function getDiffs(projectRoot: string, commits: GitCommit[]): Promise<GitDiff[]> {
  if (commits.length === 0) return [];

  const oldest = commits[0]!;
  const newest = commits[commits.length - 1]!;

  // Determine the base for the diff
  const parentExists = await hasParent(projectRoot, oldest.hash);
  const base = parentExists ? `${oldest.hash}~1` : EMPTY_TREE;
  const head = newest.hash;

  let stdout: string;
  try {
    stdout = await execGit(projectRoot, ["diff", `${base}..${head}`, "-p", "--no-color"]);
  } catch {
    return [];
  }

  if (!stdout.trim()) return [];

  // Split into per-file chunks
  const fileChunks = stdout.split(/^(?=diff --git )/m).filter((c) => c.trim());
  const diffs: GitDiff[] = [];

  for (const chunk of fileChunks) {
    // Extract filename from "diff --git a/path b/path"
    const headerMatch = chunk.match(/^diff --git a\/.+ b\/(.+)$/m);
    if (!headerMatch) continue;
    const file = headerMatch[1]!;

    // Count additions and deletions from diff lines
    let additions = 0;
    let deletions = 0;
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("+") && !line.startsWith("+++")) additions++;
      if (line.startsWith("-") && !line.startsWith("---")) deletions++;
    }

    diffs.push({ file, additions, deletions, patch: chunk });
  }

  // Truncate patches to fit within token budget
  let totalChars = diffs.reduce((sum, d) => sum + d.patch.length, 0);
  if (totalChars > MAX_DIFF_CHARS) {
    // Sort indices by patch size descending, truncate largest first
    const indices = diffs
      .map((_, i) => i)
      .sort((a, b) => diffs[b]!.patch.length - diffs[a]!.patch.length);

    for (const idx of indices) {
      if (totalChars <= MAX_DIFF_CHARS) break;
      const diff = diffs[idx]!;
      const minKeep = 200 + TRUNCATION_MARKER.length;
      if (diff.patch.length <= minKeep) continue;

      const excess = totalChars - MAX_DIFF_CHARS;
      const canRemove = diff.patch.length - minKeep;
      const truncateBy = Math.min(excess, canRemove);
      const newPatch = diff.patch.slice(0, diff.patch.length - truncateBy) + TRUNCATION_MARKER;
      totalChars -= diff.patch.length - newPatch.length;
      diff.patch = newPatch;
    }
  }

  return diffs;
}
