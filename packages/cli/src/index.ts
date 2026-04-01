import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { OutputMode } from "@askscout/core";
import { scan } from "./commands/scan.js";
import { runSetup } from "./setup.js";

interface CliArgs {
  setup: boolean;
  resume: boolean;
  standup: boolean;
  week: boolean;
  json: boolean;
  "dry-run": boolean;
}

async function main(): Promise<void> {
  const argv = (await yargs(hideBin(process.argv))
    .scriptName("askscout")
    .usage("$0 [options]")
    .option("setup", {
      type: "boolean",
      default: false,
      describe: "Configure your API key",
    })
    .option("resume", {
      type: "boolean",
      default: false,
      describe: "Output a resume prompt for AI coding tools",
    })
    .option("standup", {
      type: "boolean",
      default: false,
      describe: "Output a standup summary",
    })
    .option("week", {
      type: "boolean",
      default: false,
      describe: "Analyze the past 7 days",
    })
    .option("json", {
      type: "boolean",
      default: false,
      describe: "Output as JSON",
    })
    .option("dry-run", {
      type: "boolean",
      default: false,
      describe: "Show what would be sent without calling the API",
    })
    .check((args) => {
      if (args.resume && args.standup) {
        throw new Error("--resume and --standup cannot be used together.");
      }
      if (
        args.setup &&
        (args.resume || args.standup || args.week || args.json || args["dry-run"])
      ) {
        throw new Error("--setup cannot be combined with other options.");
      }
      return true;
    })
    .example("$0", "Daily digest since your last run")
    .example("$0 --resume", "Get a context prompt for your AI coding tools")
    .example("$0 --standup", "Copy-paste standup for Slack")
    .example("$0 --week", "Review the past 7 days")
    .example("$0 --setup", "Set up your API key (first time)")
    .help()
    .version(false)
    .strict()
    .parse()) as CliArgs;

  // Setup mode
  if (argv.setup) {
    await runSetup();
    return;
  }

  // Determine output mode
  let mode: OutputMode = "digest";
  if (argv.resume) mode = "resume";
  if (argv.standup) mode = "standup";

  // Determine time range: --week or auto (since last run)
  const timeRange = argv.week ? "week" : "auto";

  await scan({
    mode,
    timeRange,
    json: argv.json,
    dryRun: argv["dry-run"],
  });
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`\u2717 ${message}`);
  process.exitCode = 1;
});
