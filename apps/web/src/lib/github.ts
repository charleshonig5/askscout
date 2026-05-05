import type { FilesReader, GitCommit, GitDiff } from "askscout-core";

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

  // GitHub API returns commits newest-first, so reverse the order for compare
  const oldest = commits[commits.length - 1]!;
  const newest = commits[0]!;

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

/**
 * GitHub Contents API reader for stack detection in the web app.
 *
 * Mirrors the FilesReader contract used by the CLI (createLocalFilesReader):
 * returns the file contents as text, or null for any non-success outcome
 * (404, 5xx, network error, decode failure). NEVER throws.
 *
 * Performance: each reader call hits the GitHub Contents API with a short
 * timeout (8s). detectStack() issues ~10–15 reads, run in parallel via
 * Promise.all internally. To bound cost on monorepos, we also try a few
 * common app subpaths (apps/web, apps/app, etc.) when the root path 404s,
 * matching the CLI's local reader behavior.
 *
 * Files larger than ~1MB cannot be returned inline by the Contents API
 * (GitHub returns an empty content + size only). Those reads return null,
 * which is fine for our purposes — config files we care about are tiny.
 */
const GITHUB_CONTENTS_TIMEOUT_MS = 8000;
const MONOREPO_FALLBACKS = ["apps/web", "apps/app", "apps/server", "packages/web"];

type GitHubContentsResponse = {
  content?: string;
  encoding?: string;
  size?: number;
};

async function fetchContentsOnce(
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  ref: string | undefined,
): Promise<string | null> {
  try {
    const params = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    const res = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath}${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: AbortSignal.timeout(GITHUB_CONTENTS_TIMEOUT_MS),
      },
    );
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (!body || typeof body !== "object") return null;
    const c = body as GitHubContentsResponse;
    if (typeof c.content !== "string" || c.content.length === 0) return null;
    if (c.encoding !== "base64") return null;
    // Strip newlines GitHub inserts in the base64 payload before decoding.
    const cleaned = c.content.replace(/\n/g, "");
    try {
      return Buffer.from(cleaned, "base64").toString("utf-8");
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

export function createGitHubFilesReader(
  token: string,
  owner: string,
  repo: string,
  ref?: string,
): FilesReader {
  return {
    async readText(rel: string): Promise<string | null> {
      const root = await fetchContentsOnce(token, owner, repo, rel, ref);
      if (root !== null) return root;
      for (const sub of MONOREPO_FALLBACKS) {
        const hit = await fetchContentsOnce(token, owner, repo, `${sub}/${rel}`, ref);
        if (hit !== null) return hit;
      }
      return null;
    },
  };
}
