/** Supported AI providers for digest generation */
export type AiProvider = "anthropic" | "openai";

/** Supported output formats */
export type OutputMode = "digest" | "resume" | "standup";

/** Time range for git history */
export type TimeRange = "today" | "week";

/** A single item in a digest section */
export interface DigestItem {
  summary: string;
}

/** Instability detection for a file or feature */
export interface UnstableItem {
  summary: string;
  changeCount: number;
}

/** Project health indicator (unlocks after 3+ runs) */
export interface HealthIndicator {
  label: "Momentum" | "Stability" | "Focus";
  level: "Strong" | "Okay" | "Rough";
  score: number; // 0-10
  detail: string;
}

/** The full structured digest */
export interface Digest {
  vibeCheck: string;
  shipped: DigestItem[];
  changed: DigestItem[];
  unstable: UnstableItem[];
  leftOff: DigestItem[];
  stats: DigestStats;
  health: HealthIndicator[] | null; // null if < 3 runs
  keyTakeaways: string;
  resumeContext: ResumeContext;
  standupNotes: StandupNotes;
}

/** Stats section of the digest */
export interface DigestStats {
  commits: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  timeSpan: { from: Date; to: Date };
}

/** Resume prompt output */
export interface ResumePrompt {
  prompt: string;
}

/** Standup output */
export interface Standup {
  yesterday: string[];
  today: string[];
  blockers: string[];
}

/** LLM-generated resume context — rich detail for AI coding tools */
export interface ResumeContext {
  techStack: string;
  recentWork: string;
  currentFocus: string;
  keyFiles: string[];
  warnings: string[];
}

/** LLM-generated standup notes — conversational, human-sounding */
export interface StandupNotes {
  yesterday: string[];
  today: string[];
  blockers: string[];
}

/** Commit data extracted from git */
export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  timestamp: Date;
  filesChanged: string[];
  additions: number;
  deletions: number;
}

/** Diff data for a single file */
export interface GitDiff {
  file: string;
  additions: number;
  deletions: number;
  patch: string;
}

/** Persistent project state stored in .askscout/state.json */
/** A single past digest's stats — just the fields Pace Check needs.
 *  Stored locally in .askscout/state.json so the CLI can compute the
 *  same "vs your normal pace" multiplier the web shows, with zero
 *  network dependency. */
export interface DigestRunSummary {
  /** ISO timestamp of when the digest was generated. */
  runAt: string;
  /** Number of commits in that digest. Compared against today's
   *  count to compute the pace multiplier. */
  commits: number;
}

export interface ProjectState {
  version: number;
  lastRunAt: string;
  runCount: number;
  summary: string; // AI-maintained project summary, rewritten each run
  /** Rolling window of recent digest runs (newest last, capped at
   *  STATE_HISTORY_CAP). Pace Check uses the last 3 entries to
   *  compute a baseline. Empty array on first run, on migration
   *  from older state files, or when fewer than 3 prior digests
   *  have been generated. */
  digestHistory: DigestRunSummary[];
}

/** Configuration for the AI provider */
export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model?: string;
}

/** Result from the summarize function — includes the digest and an updated project summary */
export interface SummarizeResult {
  digest: Digest;
  updatedSummary: string;
}

/** Options passed to the core summarize function */
export interface SummarizeOptions {
  mode: OutputMode;
  timeRange: TimeRange;
  ai: AiConfig;
  projectRoot: string;
}
