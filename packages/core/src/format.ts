import type { Digest, ResumePrompt, Standup } from "./types.js";

/** Format a digest as a human-readable string for terminal or web */
export function formatDigest(_digest: Digest): string {
  // TODO: implement digest formatting with Scout voice
  return "";
}

/** Format a resume prompt from digest data */
export function formatResume(_digest: Digest): ResumePrompt {
  // TODO: implement resume prompt generation
  return { prompt: "" };
}

/** Format a standup summary from digest data */
export function formatStandup(_digest: Digest): Standup {
  // TODO: implement standup formatting
  return { done: [], inProgress: [], blockers: [] };
}
