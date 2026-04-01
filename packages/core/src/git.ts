import type { GitCommit, GitDiff } from "./types.js";

/** Read commits from local git history within the given time range */
// eslint-disable-next-line @typescript-eslint/require-await
export async function getCommits(_projectRoot: string, _since: Date): Promise<GitCommit[]> {
  // TODO: implement git log parsing
  return [];
}

/** Read diffs for the given commits */
// eslint-disable-next-line @typescript-eslint/require-await
export async function getDiffs(_projectRoot: string, _commits: GitCommit[]): Promise<GitDiff[]> {
  // TODO: implement git diff parsing
  return [];
}
