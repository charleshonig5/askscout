import type { ProjectState } from "./types.js";

const STATE_DIR = ".askscout";
const STATE_FILE = "state.json";

/** Read the project state file, or return null if it doesn't exist */
// eslint-disable-next-line @typescript-eslint/require-await
export async function readState(_projectRoot: string): Promise<ProjectState | null> {
  // TODO: implement state file reading
  void STATE_DIR;
  void STATE_FILE;
  return null;
}

/** Write updated project state after a digest run */
export async function writeState(_projectRoot: string, _state: ProjectState): Promise<void> {
  // TODO: implement state file writing
}
