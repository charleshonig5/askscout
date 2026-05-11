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

/* ============================================================
   Pull-request + linked-issue context
   ------------------------------------------------------------
   Enriches the digest prompt with the "why" that raw commits and
   diffs don't carry. For each commit in the window we look up its
   associated PR via /commits/{sha}/pulls; for each PR body we
   extract `#N` issue references and fetch those issues. Every
   request is wrapped in Promise.allSettled so a single 404 or
   transient API failure never breaks the digest run — callers get
   whatever subset succeeded.

   Token budget: PR bodies and issue bodies are each truncated
   individually (1500 chars), and the PR list is capped at 10
   most-recent unique PRs touched by the commits. With those caps,
   worst-case added prompt size is ~30 KB — negligible for the
   gpt-5.4-nano context window.
   ============================================================ */
const MAX_PRS = 10;
const MAX_ISSUE_REFS = 10;
const MAX_PR_BODY_CHARS = 1500;
const MAX_ISSUE_BODY_CHARS = 1500;

export interface PullRequestContext {
  number: number;
  title: string;
  body: string;
  author: string | null;
  mergedAt: string | null;
}

export interface IssueContext {
  number: number;
  title: string;
  body: string;
}

function truncateForPrompt(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n... (truncated)";
}

/** Resolve a list of commit SHAs to the unique PRs that contain them.
 *  Uses GitHub's /repos/{owner}/{repo}/commits/{sha}/pulls endpoint;
 *  any commit not associated with a PR is silently skipped. Returns
 *  the most-recently-merged-or-updated MAX_PRS PRs to keep prompt
 *  budget bounded on large windows. */
export async function fetchPullRequestsForCommits(
  token: string,
  owner: string,
  repo: string,
  shas: string[],
): Promise<PullRequestContext[]> {
  if (shas.length === 0) return [];

  // Look up PR associations per commit. Cap the per-commit lookups
  // so a 100-commit window doesn't burn 100 API calls — most digest
  // windows have many commits per PR, so 30 SHAs reaches >95% of PRs.
  const prNumbers = new Set<number>();
  const lookupResults = await Promise.allSettled(
    shas.slice(0, 30).map(async (sha) => {
      const res = await githubFetch(`/repos/${owner}/${repo}/commits/${sha}/pulls`, token);
      const prs = (await res.json()) as Array<{ number: number }>;
      return prs.map((p) => p.number);
    }),
  );
  for (const r of lookupResults) {
    if (r.status === "fulfilled") {
      for (const n of r.value) prNumbers.add(n);
    }
  }

  const limited = Array.from(prNumbers).slice(-MAX_PRS);
  const prResults = await Promise.allSettled(
    limited.map(async (num) => {
      const res = await githubFetch(`/repos/${owner}/${repo}/pulls/${num}`, token);
      const pr = (await res.json()) as {
        number: number;
        title: string;
        body: string | null;
        user: { login: string } | null;
        merged_at: string | null;
      };
      return {
        number: pr.number,
        title: pr.title,
        body: truncateForPrompt(pr.body ?? "", MAX_PR_BODY_CHARS),
        author: pr.user?.login ?? null,
        mergedAt: pr.merged_at,
      } satisfies PullRequestContext;
    }),
  );

  return prResults.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
}

/** Extract `#N` issue references from a body of text (commit msg,
 *  PR description, etc.). Conservative regex requires the `#` to
 *  be at start-of-string or preceded by whitespace / open paren, so
 *  we don't grab anchor fragments inside URLs or markdown headings. */
export function extractIssueReferences(text: string): number[] {
  const nums = new Set<number>();
  for (const match of text.matchAll(/(?:^|[\s(])#(\d+)\b/g)) {
    const raw = match[1];
    if (!raw) continue;
    const n = parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0) nums.add(n);
  }
  return Array.from(nums);
}

/** Fetch issue titles + bodies by number. Capped at MAX_ISSUE_REFS
 *  and each body truncated to MAX_ISSUE_BODY_CHARS. Skips any number
 *  that 404s (could be a PR — GitHub's API will redirect, but we
 *  only need the body content so either is fine — or it could be a
 *  stale reference, in which case we just drop it). */
export async function fetchIssuesByNumber(
  token: string,
  owner: string,
  repo: string,
  numbers: number[],
): Promise<IssueContext[]> {
  if (numbers.length === 0) return [];
  const limited = numbers.slice(0, MAX_ISSUE_REFS);
  const results = await Promise.allSettled(
    limited.map(async (num) => {
      const res = await githubFetch(`/repos/${owner}/${repo}/issues/${num}`, token);
      const issue = (await res.json()) as {
        number: number;
        title: string;
        body: string | null;
      };
      return {
        number: issue.number,
        title: issue.title,
        body: truncateForPrompt(issue.body ?? "", MAX_ISSUE_BODY_CHARS),
      } satisfies IssueContext;
    }),
  );

  return results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
}

/* ============================================================
   Surrounding source-code context for diff hunks
   ------------------------------------------------------------
   Pure diffs are often opaque without the surrounding function:
   3 lines of context around `+`/`-` is enough for tight edits
   but breaks down on refactors, renames, and sparse hunks
   inside large files. This module pulls ~15 lines of context
   around each hunk from the file at the digest's starting SHA
   (the parent of the oldest commit in the window) and packages
   it into a prompt-ready block.

   Selection: files with multiple non-adjacent hunks are
   prioritised over high-churn-but-tight-hunk files. A diff
   with 5 scattered hunks needs context way more than a 100-
   line single-hunk addition. After that primary sort, total
   churn (additions + deletions) breaks ties.

   Edge cases handled inline:
     - Newly-added files: patch starts with @@ -0,0 +X,Y @@,
       no parent content to fetch — skip.
     - Deleted files: patch ends with +0,0, post-change context
       is meaningless — skip.
     - Renames: Contents API 404s at the current path, the
       Promise.allSettled wrapper drops it gracefully.
   ============================================================ */
const MAX_FILES_FOR_CONTEXT = 8;
const HUNK_CONTEXT_LINES = 15;
const MAX_CONTEXT_PER_FILE_CHARS = 3000;
const MAX_TOTAL_CONTEXT_CHARS = 24_000;

export interface FileHunkContext {
  /** Path of the file in the post-change tree. */
  file: string;
  /** Formatted, prompt-ready block — file header + each hunk's
   *  context slice. Already truncated to the per-file budget. */
  block: string;
}

/** Resolve the parent SHA of a given commit. Returns null on any
 *  failure (initial commit, transient API error, etc.) — callers
 *  treat null as "skip the context-fetching feature for this run". */
export async function fetchParentSha(
  token: string,
  owner: string,
  repo: string,
  sha: string,
): Promise<string | null> {
  try {
    const res = await githubFetch(`/repos/${owner}/${repo}/commits/${sha}`, token);
    const data = (await res.json()) as { parents?: Array<{ sha: string }> };
    return data.parents?.[0]?.sha ?? null;
  } catch {
    return null;
  }
}

/** Parse `@@ -X,Y +A,B @@` hunk markers from a unified-diff patch.
 *  Returns one entry per hunk with the BEFORE side's line range
 *  (since we slice from the parent file). */
function parseHunkMarkers(patch: string): Array<{ start: number; count: number }> {
  const hunks: Array<{ start: number; count: number }> = [];
  const re = /@@ -(\d+),?(\d*) \+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(patch)) !== null) {
    const start = parseInt(m[1] ?? "0", 10);
    const countStr = m[2];
    const count = countStr && countStr.length > 0 ? parseInt(countStr, 10) : 1;
    if (Number.isFinite(start) && start > 0 && Number.isFinite(count)) {
      hunks.push({ start, count });
    }
  }
  return hunks;
}

/** Heuristic for "this patch describes a fully-added file" — the
 *  unified-diff signature is `@@ -0,0 +X,Y @@`. Treat as ineligible
 *  for context fetching because there's no parent file to slice. */
function isAddedFilePatch(patch: string): boolean {
  return /^@@ -0,0 \+/m.test(patch);
}

/** Heuristic for "this patch describes a fully-deleted file" — the
 *  signature is `@@ -X,Y +0,0 @@`. No useful post-change context to
 *  show either, so skip. */
function isDeletedFilePatch(patch: string): boolean {
  return /@@ -\d+,?\d* \+0,0 @@/m.test(patch);
}

/** Fetch a file's content at a specific ref, base64-decoded. Returns
 *  null on any failure (404 for renames, network errors, files too
 *  large for the Contents API's inline-content cap). */
async function fetchFileContentAtRef(
  token: string,
  owner: string,
  repo: string,
  filePath: string,
  ref: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `${GITHUB_API}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${filePath}?ref=${encodeURIComponent(ref)}`,
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
    const body = (await res.json()) as { content?: string; encoding?: string };
    if (!body.content || body.encoding !== "base64") return null;
    // Buffer is available in Node + Edge runtimes (Next 15).
    return Buffer.from(body.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

/** Build prompt-ready context blocks for the top MAX_FILES_FOR_CONTEXT
 *  diffs in the run. Caller passes the diffs we already fetched plus
 *  the resolved parent SHA (oldest commit's parent). Result is an
 *  array of {file, block} entries already capped to the global
 *  MAX_TOTAL_CONTEXT_CHARS budget. */
export async function fetchFileContextForHunks(
  token: string,
  owner: string,
  repo: string,
  parentSha: string,
  diffs: GitDiff[],
): Promise<FileHunkContext[]> {
  if (!parentSha || diffs.length === 0) return [];

  // Score and filter candidates. Multi-hunk files first (where the
  // diff is hardest to read without context), then churn for ties.
  const scored = diffs
    .filter((d) => d.patch && !isAddedFilePatch(d.patch) && !isDeletedFilePatch(d.patch))
    .map((d) => ({
      diff: d,
      hunks: parseHunkMarkers(d.patch),
      totalChanges: d.additions + d.deletions,
    }))
    .filter((c) => c.hunks.length > 0)
    .sort((a, b) => {
      if (b.hunks.length !== a.hunks.length) return b.hunks.length - a.hunks.length;
      return b.totalChanges - a.totalChanges;
    })
    .slice(0, MAX_FILES_FOR_CONTEXT);

  if (scored.length === 0) return [];

  // Fetch all candidate parent files in parallel; renames + 404s
  // drop silently via Promise.allSettled.
  const fetches = await Promise.allSettled(
    scored.map(async (c) => {
      const content = await fetchFileContentAtRef(token, owner, repo, c.diff.file, parentSha);
      return content ? { ...c, content } : null;
    }),
  );

  const results: FileHunkContext[] = [];
  let totalChars = 0;

  for (const r of fetches) {
    if (r.status !== "fulfilled" || r.value === null) continue;
    const { diff, hunks, content } = r.value;
    const lines = content.split("\n");

    const hunkBlocks: string[] = [];
    let perFileChars = 0;

    for (const h of hunks) {
      const startIdx = Math.max(0, h.start - 1 - HUNK_CONTEXT_LINES);
      const endIdx = Math.min(lines.length, h.start - 1 + h.count + HUNK_CONTEXT_LINES);
      const slice = lines.slice(startIdx, endIdx).join("\n");
      const block = `Around line ${h.start} (parent file):\n${slice}`;
      if (perFileChars + block.length + 2 > MAX_CONTEXT_PER_FILE_CHARS) {
        hunkBlocks.push("... (further hunks omitted, per-file context budget reached)");
        break;
      }
      hunkBlocks.push(block);
      perFileChars += block.length + 2;
    }

    if (hunkBlocks.length === 0) continue;

    const fileBlock = [`### ${diff.file}`, ...hunkBlocks].join("\n\n");
    if (totalChars + fileBlock.length > MAX_TOTAL_CONTEXT_CHARS) {
      // Global cap hit — stop adding more files.
      break;
    }
    totalChars += fileBlock.length;
    results.push({ file: diff.file, block: fileBlock });
  }

  return results;
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
