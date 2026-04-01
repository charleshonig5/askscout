import type { AiConfig, Digest, GitCommit, GitDiff, ProjectState } from "./types.js";

/** Send git data to the LLM and return a structured digest */
// eslint-disable-next-line @typescript-eslint/require-await
export async function summarize(
  _commits: GitCommit[],
  _diffs: GitDiff[],
  _state: ProjectState | null,
  _ai: AiConfig,
): Promise<Digest> {
  // TODO: implement LLM summarization
  throw new Error("Not implemented");
}
