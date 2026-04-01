import fs from "node:fs/promises";
import path from "node:path";
import { startSpinner } from "../spinner.js";
import {
  formatDigest,
  formatResume,
  formatStandup,
  getCommits,
  getDiffs,
  getRepoName,
  readState,
  summarize,
  writeState,
} from "@askscout/core";
import type { OutputMode, ProjectState } from "@askscout/core";
import { loadConfig } from "../config.js";
import { inlineSetup } from "../setup.js";

export interface ScanOptions {
  mode: OutputMode;
  timeRange: "week" | "auto";
  json: boolean;
  dryRun: boolean;
}

/** Walk up from cwd to find the nearest .git directory */
async function findProjectRoot(): Promise<string> {
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    try {
      const stat = await fs.stat(path.join(dir, ".git"));
      if (stat.isDirectory()) return dir;
    } catch {
      // not found, keep walking up
    }
    dir = path.dirname(dir);
  }

  throw new Error("Not a git repository (no .git found).");
}

/** Calculate the "since" date — smart default based on state */
function getSinceDate(timeRange: ScanOptions["timeRange"], state: ProjectState | null): Date {
  if (timeRange === "week") {
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }
  // auto: use lastRunAt if recent enough, otherwise today
  if (state?.lastRunAt) {
    const lastRun = new Date(state.lastRunAt);
    const daysSince = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60 * 24);
    // Cap at 30 days — anything older gets the FRE fallback chain
    if (daysSince <= 30) return lastRun;
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Format a human-readable time label from a since date */
function formatTimeLabel(since: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - since.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (since.toDateString() === now.toDateString()) return "today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (since.toDateString() === yesterday.toDateString()) return "since yesterday";

  if (diffDays <= 1) return "since yesterday";
  return `past ${diffDays} days`;
}

/** Main scan command — reads git history and generates a digest */
export async function scan(options: ScanOptions): Promise<void> {
  // 1. Find project root
  const projectRoot = await findProjectRoot();

  // 2. Start spinner
  let spinner = startSpinner("\ud83d\udc15 Scout is sniffing through your commits...");

  try {
    // 3. Read project state + repo name
    const state = await readState(projectRoot);
    const repoName = await getRepoName(projectRoot);
    const isFirstRun = state === null;

    // 4. Calculate time range with smart defaults
    let since = getSinceDate(options.timeRange, state);
    let commits = await getCommits(projectRoot, since);

    // 5. If auto range found no commits, widen the search
    //    Triggers on first run OR when lastRunAt was capped (>30 days stale)
    if (options.timeRange === "auto" && commits.length === 0) {
      for (const days of [7, 30, 90]) {
        since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        commits = await getCommits(projectRoot, since);
        if (commits.length > 0) break;
      }
    }

    const timeLabel = formatTimeLabel(since);

    if (commits.length === 0) {
      spinner.stop();
      if (isFirstRun) {
        console.log(
          `\ud83d\udc15 Scout checked out ${repoName} but didn't find any recent commits.`,
        );
        console.log("   Is this a brand new repo? Make some commits and come back!");
      } else {
        console.log(`\ud83d\udc15 Scout didn't find any new commits ${timeLabel}.`);
        console.log("   Try: askscout --week");
      }
      return;
    }

    // 6. Get diffs
    const diffs = await getDiffs(projectRoot, commits);

    // 7. Dry run — show what would be sent (no API key needed)
    if (options.dryRun) {
      spinner.stop();
      console.log(`[DRY RUN] ${repoName} \u00b7 ${commits.length} commits \u00b7 ${timeLabel}\n`);
      console.log(`Files changed: ${new Set(diffs.map((d) => d.file)).size}`);
      console.log(
        `Lines: +${diffs.reduce((s, d) => s + d.additions, 0)} / -${diffs.reduce((s, d) => s + d.deletions, 0)}`,
      );
      console.log(
        `State: ${state ? `run #${state.runCount}, last run ${state.lastRunAt}` : "first run"}\n`,
      );
      console.log("Commits:");
      for (const c of commits) {
        console.log(`  ${c.hash.slice(0, 7)} ${c.message}`);
      }
      console.log("\nRun without --dry-run to generate digest.");
      return;
    }

    // 8. Load config — if missing, run inline setup (first run flows straight to digest)
    let config = await loadConfig();
    if (!config) {
      spinner.stop();
      if (process.stdin.isTTY) {
        config = await inlineSetup();
        if (!config) {
          process.exitCode = 1;
          return;
        }
        // Resume spinner for the LLM call
        console.error("   Generating your first digest...\n");
        spinner = startSpinner("\ud83d\udc15 Scout is crunching the numbers...");
      } else {
        // Non-interactive (piped, CI) — can't prompt
        console.error("\u2717 No API key found. Run: askscout --setup");
        process.exitCode = 1;
        return;
      }
    }

    // 9. Call summarize
    const result = await summarize(commits, diffs, state, {
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
    });

    // 10. Stop spinner
    spinner.stop();

    // 11. Format and output
    const formatOpts = { repoName, timeLabel };

    if (options.json) {
      const output =
        options.mode === "digest"
          ? result.digest
          : options.mode === "resume"
            ? formatResume(result.digest)
            : formatStandup(result.digest);
      console.log(JSON.stringify(output, null, 2));
    } else if (options.mode === "resume") {
      const resume = formatResume(result.digest);
      console.log(resume.prompt);
    } else if (options.mode === "standup") {
      const standup = formatStandup(result.digest);
      console.log("Yesterday:");
      for (const item of standup.yesterday) console.log(`  \u2022 ${item}`);
      console.log("\nToday:");
      for (const item of standup.today) console.log(`  \u2022 ${item}`);
      if (standup.blockers.length > 0) {
        console.log("\nBlockers:");
        for (const item of standup.blockers) console.log(`  \u2022 ${item}`);
      }
    } else {
      console.log(formatDigest(result.digest, formatOpts));
    }

    // 12. Update state
    const newRunCount = (state?.runCount ?? 0) + 1;
    await writeState(projectRoot, {
      version: 1,
      lastRunAt: new Date().toISOString(),
      runCount: newRunCount,
      summary: result.updatedSummary,
    });

    // 13. Show tip for first 5 runs (discoverability)
    if (newRunCount <= 5 && !options.json) {
      console.log(
        "Tip: --resume to get a prompt for your AI tools \u00b7 --standup for a copy-paste standup",
      );
    }
  } catch (err) {
    spinner.stop();
    throw err;
  }
}
