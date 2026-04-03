import type { GitCommit, GitDiff } from "@askscout/core";

const GITHUB_API = "https://api.github.com";
const MAX_DIFF_CHARS = 12_000;
const TRUNCATION_MARKER = "\n... (truncated)";
const MAX_COMMITS_TO_LLM = 30;

// Files to exclude from diffs (noisy, not useful for summaries)
const NOISY_FILE_PATTERNS = [
  /^pnpm-lock\.yaml$/,
  /^package-lock\.json$/,
  /^yarn\.lock$/,
  /\.lock$/,
  /^\.pnpm-approve-builds\.json$/,
  /^\.next\//,
  /^dist\//,
  /^node_modules\//,
  /\.min\.(js|css)$/,
  /\.map$/,
  /\.d\.ts$/,
  /\.tsbuildinfo$/,
];

interface GitHubRepo {
  full_name: string;
  name: string;
  owner: { login: string };
  private: boolean;
  pushed_at: string;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  stats?: { additions: number; deletions: number };
  files?: { filename: string; additions: number; deletions: number; patch?: string }[];
}

async function githubFetch(endpoint: string, token: string): Promise<Response> {
  const res = await fetch(`${GITHUB_API}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    signal: AbortSignal.timeout(15000), // 15 second timeout
  });

  if (!res.ok) {
    // Log the real error server-side, but don't expose details
    const body = await res.text().catch(() => "");
    console.error(`GitHub API error (${res.status}): ${body.slice(0, 200)}`);
    throw new Error(`GitHub API error (${res.status})`);
  }

  return res;
}

/** List the authenticated user's repos, sorted by most recently pushed */
export async function fetchUserRepos(token: string): Promise<string[]> {
  const res = await githubFetch("/user/repos?sort=pushed&direction=desc&per_page=50", token);
  const repos = (await res.json()) as GitHubRepo[];
  return repos.map((r) => r.full_name);
}

/** Fetch commits for a repo since a given date */
export async function fetchCommits(
  token: string,
  owner: string,
  repo: string,
  since?: Date,
): Promise<GitCommit[]> {
  let endpoint = `/repos/${owner}/${repo}/commits?per_page=100`;
  if (since) {
    endpoint += `&since=${since.toISOString()}`;
  }

  const res = await githubFetch(endpoint, token);
  const raw = (await res.json()) as GitHubCommit[];

  // Fetch details for up to 20 most recent commits (for file stats)
  const detailed = await Promise.all(
    raw.slice(0, 20).map(async (c) => {
      try {
        const detailRes = await githubFetch(`/repos/${owner}/${repo}/commits/${c.sha}`, token);
        return (await detailRes.json()) as GitHubCommit;
      } catch {
        return c;
      }
    }),
  );

  // Merge detailed data back
  const commitMap = new Map(detailed.map((d) => [d.sha, d]));

  // Cap commits sent to LLM to avoid prompt bloat
  const capped = raw.slice(0, MAX_COMMITS_TO_LLM);

  return capped.map((c) => {
    const detail = commitMap.get(c.sha);
    return {
      hash: c.sha,
      message: c.commit.message.split("\n")[0] ?? c.commit.message,
      author: c.commit.author.name,
      timestamp: new Date(c.commit.author.date),
      filesChanged: detail?.files?.map((f) => f.filename) ?? [],
      additions: detail?.stats?.additions ?? 0,
      deletions: detail?.stats?.deletions ?? 0,
    };
  });
}

export interface FetchDiffsResult {
  diffs: GitDiff[];
  filesAdded: number;
  filesRemoved: number;
}

/** Fetch diffs between two commits using the Compare API */
export async function fetchDiffs(
  token: string,
  owner: string,
  repo: string,
  commits: GitCommit[],
): Promise<FetchDiffsResult> {
  if (commits.length === 0) return { diffs: [], filesAdded: 0, filesRemoved: 0 };

  const oldest = commits[0]!;
  const newest = commits[commits.length - 1]!;

  // For single commit or initial commits, fetch the commit directly
  let files: {
    filename: string;
    additions: number;
    deletions: number;
    patch?: string;
    status?: string;
  }[];

  if (commits.length === 1) {
    const res = await githubFetch(`/repos/${owner}/${repo}/commits/${oldest.hash}`, token);
    const data = (await res.json()) as GitHubCommit;
    files = data.files ?? [];
  } else {
    try {
      const res = await githubFetch(
        `/repos/${owner}/${repo}/compare/${oldest.hash}^...${newest.hash}`,
        token,
      );
      const data = (await res.json()) as { files?: typeof files };
      files = data.files ?? [];
    } catch {
      // Fallback: compare oldest to newest directly (may miss the oldest commit's changes)
      try {
        const res = await githubFetch(
          `/repos/${owner}/${repo}/compare/${oldest.hash}...${newest.hash}`,
          token,
        );
        const data = (await res.json()) as { files?: typeof files };
        files = data.files ?? [];
      } catch {
        return { diffs: [], filesAdded: 0, filesRemoved: 0 };
      }
    }
  }

  // Count file additions/removals before filtering
  const filesAdded = files.filter((f) => f.status === "added").length;
  const filesRemoved = files.filter((f) => f.status === "removed").length;

  // Filter out noisy files that don't contribute to useful summaries
  const filtered = files.filter(
    (f) => !NOISY_FILE_PATTERNS.some((pattern) => pattern.test(f.filename)),
  );

  const diffs: GitDiff[] = filtered.map((f) => ({
    file: f.filename,
    additions: f.additions,
    deletions: f.deletions,
    patch: f.patch ?? "",
  }));

  // Truncate patches to fit within token budget
  let totalChars = diffs.reduce((sum, d) => sum + d.patch.length, 0);
  if (totalChars > MAX_DIFF_CHARS) {
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

  return { diffs, filesAdded, filesRemoved };
}
