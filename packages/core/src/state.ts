import fs from "node:fs/promises";
import path from "node:path";
import type { ProjectState } from "./types.js";

const STATE_DIR = ".askscout";
const STATE_FILE = "state.json";

function isValidState(value: unknown): value is ProjectState {
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

/** Read the project state file, or return null if it doesn't exist */
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

  if (!isValidState(parsed)) {
    console.warn(`[askscout] Invalid state file at ${filePath}, ignoring.`);
    return null;
  }

  return parsed;
}

/** Write updated project state after a digest run */
export async function writeState(projectRoot: string, state: ProjectState): Promise<void> {
  const dirPath = path.join(projectRoot, STATE_DIR);
  await fs.mkdir(dirPath, { recursive: true });
  const filePath = path.join(dirPath, STATE_FILE);
  await fs.writeFile(filePath, JSON.stringify(state, null, 2) + "\n", "utf-8");
}
