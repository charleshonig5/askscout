import type { OutputMode, TimeRange } from "@askscout/core";

export interface ScanOptions {
  mode: OutputMode;
  timeRange: TimeRange;
  json: boolean;
  dryRun: boolean;
}

/** Main scan command — reads git history and generates a digest */
export async function scan(_options: ScanOptions): Promise<void> {
  // TODO: implement main scan flow
  // 1. Resolve project root (find .git directory)
  // 2. Read project state (.askscout/state.json)
  // 3. Read API key from config
  // 4. Get commits since last run (or within time range)
  // 5. Get diffs for those commits
  // 6. If --dry-run, print the prompt and exit
  // 7. Call summarize()
  // 8. Format output based on mode
  // 9. Update project state
  // 10. Print to terminal (or output JSON)
}
