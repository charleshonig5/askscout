import fs from "node:fs/promises";
import path from "node:path";
import { startSpinner } from "../spinner.js";
import {
  formatDigest,
  formatResume,
  formatStandup,
  getCommits,
  getDiffs,
  readState,
  summarize,
  writeState,
} from "@askscout/core";
import type { OutputMode, TimeRange } from "@askscout/core";
import { loadConfig } from "../config.js";

export interface ScanOptions {
  mode: OutputMode;
  timeRange: TimeRange;
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

/** Calculate the "since" date based on time range */
function getSinceDate(timeRange: TimeRange): Date {
  if (timeRange === "week") {
    return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }
  // today: midnight local time
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Format a human-readable time label */
function getTimeLabel(timeRange: TimeRange): string {
  if (timeRange === "week") return "over the past week";
  const hour = new Date().getHours();
  return hour < 12 ? "since this morning" : "since today";
}

/** Main scan command — reads git history and generates a digest */
export async function scan(options: ScanOptions): Promise<void> {
  // 1. Find project root
  const projectRoot = await findProjectRoot();

  // 2. Calculate time range
  const since = getSinceDate(options.timeRange);
  const timeLabel = getTimeLabel(options.timeRange);

  // 3. Start spinner
  const spinner = startSpinner("\ud83d\udc15 Scout is sniffing through your commits...");

  try {
    // 4. Read project state
    const state = await readState(projectRoot);

    // 5. Get commits
    const commits = await getCommits(projectRoot, since);

    if (commits.length === 0) {
      spinner.stop();
      console.log(`\ud83d\udc15 Scout didn't find any commits ${timeLabel}.`);
      if (options.timeRange === "today") {
        console.log("   Try: askscout --week");
      }
      return;
    }

    // 6. Get diffs
    const diffs = await getDiffs(projectRoot, commits);

    // 7. Dry run — show what would be sent (no API key needed)
    if (options.dryRun) {
      spinner.stop();
      console.log("[DRY RUN \u2014 No API call will be made]\n");
      console.log(`Commits: ${commits.length}`);
      console.log(`Files changed: ${new Set(diffs.map((d) => d.file)).size}`);
      console.log(
        `Lines: +${diffs.reduce((s, d) => s + d.additions, 0)} / -${diffs.reduce((s, d) => s + d.deletions, 0)}`,
      );
      console.log(`Project context: ${state?.summary || "No previous context (first run)"}\n`);
      console.log("Commits that would be analyzed:");
      for (const c of commits) {
        console.log(`  ${c.hash.slice(0, 7)} ${c.message}`);
      }
      console.log("\nRun without --dry-run to generate digest.");
      return;
    }

    // 8. Load config (only needed for actual API calls)
    const config = await loadConfig();
    if (!config) {
      spinner.stop();
      console.error("\u2717 No API key found. Run: askscout --setup");
      process.exitCode = 1;
      return;
    }

    // 9. Call summarize
    const result = await summarize(commits, diffs, state, {
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
    });

    // 10. Stop spinner
    spinner.stop();
    console.log(
      `\ud83d\udc15 Scout sniffed through ${commits.length} ${commits.length === 1 ? "commit" : "commits"} ${timeLabel}...\n`,
    );

    // 11. Format and output
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
      console.log("Done:");
      for (const item of standup.done) console.log(`  \u2022 ${item}`);
      console.log("\nIn progress:");
      for (const item of standup.inProgress) console.log(`  \u2022 ${item}`);
      if (standup.blockers.length > 0) {
        console.log("\nBlockers:");
        for (const item of standup.blockers) console.log(`  \u2022 ${item}`);
      }
    } else {
      console.log(formatDigest(result.digest));
    }

    // 12. Update state
    await writeState(projectRoot, {
      version: 1,
      lastRunAt: new Date().toISOString(),
      runCount: (state?.runCount ?? 0) + 1,
      summary: result.updatedSummary,
    });
  } catch (err) {
    spinner.stop();
    throw err;
  }
}
