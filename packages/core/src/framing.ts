import { readFile } from "node:fs/promises";
import path from "node:path";

/* ============================================================
   Project framing: README + manifest (CLI port)
   ------------------------------------------------------------
   Mirrors apps/web/src/lib/github.ts's fetchProjectFraming but
   reads directly from the working tree via fs.readFile instead
   of the GitHub Contents API. Same priority order, same caps,
   same package.json field filter so CLI and web prompts get
   identical framing for any repo that has both versions.
   ============================================================ */
const MAX_README_CHARS = 3000;
const MAX_MANIFEST_CHARS = 2000;
const README_CANDIDATES = ["README.md", "readme.md", "README", "Readme.md"] as const;
const MANIFEST_CANDIDATES = [
  "package.json",
  "pyproject.toml",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "Gemfile",
] as const;

export interface ProjectFraming {
  readme: string | null;
  manifest: { path: string; content: string } | null;
}

/** Truncate a README at a sentence boundary near `max` if possible.
 *  Falls back to a hard cut if no boundary is found in the tail. */
function truncateReadme(content: string, max: number): string {
  if (content.length <= max) return content;
  const head = content.slice(0, max);
  const lastBoundary = Math.max(
    head.lastIndexOf("\n\n"),
    head.lastIndexOf(". "),
    head.lastIndexOf(".\n"),
  );
  if (lastBoundary > max * 0.6) {
    return head.slice(0, lastBoundary + 1) + "\n... (truncated)";
  }
  return head + "\n... (truncated)";
}

/** Strip package.json down to the fields that frame the project for
 *  the LLM. Drops repo URL, bugs, keywords, author, and any other
 *  metadata that adds tokens without context value. */
function filterPackageJson(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const keep = [
      "name",
      "description",
      "version",
      "scripts",
      "dependencies",
      "devDependencies",
      "peerDependencies",
    ];
    const filtered: Record<string, unknown> = {};
    for (const k of keep) {
      if (parsed[k] !== undefined) filtered[k] = parsed[k];
    }
    return JSON.stringify(filtered, null, 2);
  } catch {
    // Malformed JSON — pass raw through, the LLM can still read it.
    return raw;
  }
}

async function readIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

/** Read README + one project manifest from the working tree. Both
 *  lookups are graceful: any missing file just drops that piece
 *  from the return value. Caller can ship a partial framing block
 *  (README only, manifest only, or empty). */
export async function getProjectFraming(projectRoot: string): Promise<ProjectFraming> {
  let readme: string | null = null;
  for (const name of README_CANDIDATES) {
    const content = await readIfExists(path.join(projectRoot, name));
    if (content) {
      readme = truncateReadme(content, MAX_README_CHARS);
      break;
    }
  }

  let manifest: ProjectFraming["manifest"] = null;
  for (const name of MANIFEST_CANDIDATES) {
    const content = await readIfExists(path.join(projectRoot, name));
    if (content) {
      const filtered = name === "package.json" ? filterPackageJson(content) : content;
      manifest = {
        path: name,
        content:
          filtered.length > MAX_MANIFEST_CHARS
            ? filtered.slice(0, MAX_MANIFEST_CHARS) + "\n... (truncated)"
            : filtered,
      };
      break;
    }
  }

  return { readme, manifest };
}
