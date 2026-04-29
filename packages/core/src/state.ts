import fs from "node:fs/promises";
import path from "node:path";
import type { DigestRunSummary, ProjectState } from "./types.js";

const STATE_DIR = ".askscout";
const STATE_FILE = "state.json";
/** Maximum past-digest entries kept in state.json. Pace Check only
 *  reads the last 3, but we hold a slightly bigger window so future
 *  features (longer rolling averages, trend analysis) don't have to
 *  bump the schema again. 10 entries is well under any size concern
 *  — at ~80 bytes per entry it adds <1 KB to state.json. */
export const STATE_HISTORY_CAP = 10;

/** Validates the four required ProjectState fields. digestHistory is
 *  intentionally NOT required here so older state.json files (v1,
 *  written before the field existed) read cleanly — the field is
 *  defaulted to [] in readState() below. */
function isValidStateBase(value: unknown): value is Omit<ProjectState, "digestHistory"> {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.version === "number" &&
    Number.isFinite(obj.version) &&
    typeof obj.lastRunAt === "string" &&
    typeof obj.runCount === "number" &&
    Number.isFinite(obj.runCount) &&
    typeof obj.summary === "string"
  );
}

/** Sanitize whatever's in the parsed digestHistory field. Drops any
 *  entries with malformed shape (missing/wrong-typed fields) so a
 *  partially-corrupted state file still produces a usable history
 *  rather than tipping the whole read into "ignore everything." */
function normalizeDigestHistory(value: unknown): DigestRunSummary[] {
  if (!Array.isArray(value)) return [];
  const out: DigestRunSummary[] = [];
  for (const entry of value) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    if (
      typeof e.runAt !== "string" ||
      typeof e.commits !== "number" ||
      !Number.isFinite(e.commits)
    ) {
      continue;
    }
    out.push({ runAt: e.runAt, commits: e.commits });
  }
  // Keep only the most recent N — older state files may have grown
  // larger before we capped, and we don't want them to keep growing.
  return out.slice(-STATE_HISTORY_CAP);
}

/** Read the project state file, or return null if it doesn't exist.
 *  Tolerates older state files (without digestHistory) by defaulting
 *  the field to []. */
export async function readState(projectRoot: string): Promise<ProjectState | null> {
  const filePath = path.join(projectRoot, STATE_DIR, STATE_FILE);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(`[askscout] Corrupt state file at ${filePath}, ignoring.`);
    return null;
  }

  if (!isValidStateBase(parsed)) {
    console.warn(`[askscout] Invalid state file at ${filePath}, ignoring.`);
    return null;
  }

  const obj = parsed as Record<string, unknown>;
  return {
    version: parsed.version,
    lastRunAt: parsed.lastRunAt,
    runCount: parsed.runCount,
    summary: parsed.summary,
    digestHistory: normalizeDigestHistory(obj.digestHistory),
  };
}

/** Append a new run to a digest history array, keeping it capped at
 *  STATE_HISTORY_CAP entries. Returns a new array; safe to call
 *  before writeState. */
export function appendDigestRun(
  history: DigestRunSummary[],
  run: DigestRunSummary,
): DigestRunSummary[] {
  return [...history, run].slice(-STATE_HISTORY_CAP);
}

/** Write updated project state after a digest run */
export async function writeState(projectRoot: string, state: ProjectState): Promise<void> {
  const dirPath = path.join(projectRoot, STATE_DIR);
  await fs.mkdir(dirPath, { recursive: true });
  const filePath = path.join(dirPath, STATE_FILE);
  await fs.writeFile(filePath, JSON.stringify(state, null, 2) + "\n", "utf-8");
}
