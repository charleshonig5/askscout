/**
 * Deterministic Heads Up signal extraction.
 *
 * Extracts two kinds of signals from raw git data, with a hard
 * accuracy guarantee: nothing surfaced here is invented or
 * paraphrased. Every line is grounded in something the user
 * literally typed.
 *
 *   1. TODO / FIXME / HACK / XXX / BUG comments the user added in
 *      this digest's diffs. Only matches comment-syntax markers on
 *      added lines (lines starting with "+" in the unified diff),
 *      so stale TODOs in untouched code never get surfaced.
 *
 *   2. Flagged commit messages: commits whose subject contains
 *      "wip", "broken", "hack", "temp"/"tmp", "fixme", "debug",
 *      "ignore me", or whose subject opens with a "fix:" prefix
 *      AND has a non-trivial diff (>= 50 lines changed). Verbatim
 *      quoting only — the LLM is never asked to paraphrase.
 *
 * The output is injected into the LLM user prompt as facts the
 * model is instructed to surface verbatim in the Heads Up block.
 * The model retains the ability to add ONE additional inferred
 * bullet for nuance the rules can't see.
 */

import type { GitCommit, GitDiff } from "./types.js";

export type ExtractedTodo = {
  file: string;
  line: number; // line number in the post-change file
  marker: "TODO" | "FIXME" | "HACK" | "XXX" | "BUG";
  text: string; // verbatim comment text, comment chars stripped
};

export type FlaggedCommit = {
  hash: string;
  shortHash: string;
  message: string; // verbatim subject line
  reason: "wip" | "broken" | "hack" | "fix-uncertain";
};

const MAX_TODOS = 5;
const MAX_TEXT_LEN = 160;

const TODO_MARKER_RE = /\b(TODO|FIXME|HACK|XXX|BUG)\b/;
// Matches a line containing one of the markers preceded by a
// recognized comment opener. The opener can be //, #, /*, or *
// (block-comment continuation). Allows arbitrary leading whitespace
// and non-word chars (to handle JSX {/* TODO */} and similar).
// Captures the marker and the trailing text.
const TODO_LINE_RE =
  /(?:^|[\s({[<])(?:\/\/|#|\/\*|\*)\s*(TODO|FIXME|HACK|XXX|BUG)\b\s*[:\-]?\s*(.*?)\s*(?:\*\/)?\s*$/;

const HUNK_HEADER_RE = /^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/;

const truncate = (s: string): string =>
  s.length > MAX_TEXT_LEN ? s.slice(0, MAX_TEXT_LEN) + "..." : s;

/**
 * Parse a unified diff patch and yield TODO/FIXME comments the user
 * ADDED on lines starting with "+". Walks each hunk's "+lines and
 * context lines" tracking the post-change line number so the
 * surfaced location matches what the user sees in their editor.
 *
 * Strict: only matches when the marker is in a recognized comment
 * context. A bare "+    rate: 'TODO'" string literal will not match.
 * The diff is patch-only; no full-file scan.
 */
function extractTodosFromPatch(file: string, patch: string): ExtractedTodo[] {
  const out: ExtractedTodo[] = [];
  if (!patch) return out;
  let newLine = 0;
  for (const raw of patch.split("\n")) {
    if (raw.startsWith("@@")) {
      const m = HUNK_HEADER_RE.exec(raw);
      if (m) newLine = parseInt(m[1]!, 10);
      continue;
    }
    if (raw.startsWith("+++") || raw.startsWith("---")) continue;
    if (raw.startsWith("-")) {
      // removed line, no contribution to newLine
      continue;
    }
    if (raw.startsWith("+")) {
      const lineContent = raw.slice(1);
      if (TODO_MARKER_RE.test(lineContent)) {
        const m = TODO_LINE_RE.exec(lineContent);
        if (m) {
          const marker = m[1] as ExtractedTodo["marker"];
          // Strip any trailing comment-close sequence the regex didn't
          // peel off (e.g., "*/", "*/}" in JSX, "-->" in HTML, "*/" in
          // C-style block comments).
          const cleaned = (m[2] ?? "")
            .trim()
            .replace(/\s*(?:\*\/[)}\]]?|-->|\*\/)\s*$/g, "")
            .trim();
          out.push({ file, line: newLine, marker, text: truncate(cleaned) });
        }
      }
      newLine += 1;
    } else {
      // context line (starts with " ") or empty line
      newLine += 1;
    }
  }
  return out;
}

export function extractTodosFromDiffs(diffs: GitDiff[]): ExtractedTodo[] {
  const all: ExtractedTodo[] = [];
  for (const d of diffs) {
    if (!d.patch) continue;
    for (const t of extractTodosFromPatch(d.file, d.patch)) {
      all.push(t);
      if (all.length >= MAX_TODOS) return all;
    }
  }
  return all;
}

const FLAG_PATTERNS: Array<{ re: RegExp; reason: FlaggedCommit["reason"] }> = [
  { re: /\bwip\b/i, reason: "wip" },
  { re: /\b(?:still\s+)?broken\b/i, reason: "broken" },
  { re: /\bdoesn'?t\s+work\b/i, reason: "broken" },
  { re: /\b(?:hack|hacky|kludge)\b/i, reason: "hack" },
  { re: /\b(?:temp|tmp)\b/i, reason: "wip" },
  { re: /\bfixme\b/i, reason: "wip" },
  { re: /\bdebug\b/i, reason: "wip" },
  { re: /\bignore\s+me\b/i, reason: "wip" },
];

/**
 * Pick out commits whose subject lines admit unfinished or risky
 * work. Two paths:
 *  - Subject matches one of the explicit risk patterns above.
 *  - Subject opens with "fix:" / "fix(" and the commit has a
 *    non-trivial diff (>= 50 added+removed lines). Filters out
 *    "fix: typo" noise without demanding the user be more precise.
 *
 * Verbatim quoting only. No paraphrasing, no reformatting beyond
 * trimming whitespace.
 */
export function extractFlaggedCommits(commits: GitCommit[]): FlaggedCommit[] {
  const out: FlaggedCommit[] = [];
  for (const c of commits) {
    const subject = c.message.split("\n", 1)[0]!.trim();
    if (subject.length === 0) continue;
    let reason: FlaggedCommit["reason"] | null = null;
    for (const p of FLAG_PATTERNS) {
      if (p.re.test(subject)) {
        reason = p.reason;
        break;
      }
    }
    if (reason === null) {
      const isFixCommit = /^fix[:(]/i.test(subject);
      const totalLines = c.additions + c.deletions;
      if (isFixCommit && totalLines >= 50) reason = "fix-uncertain";
    }
    if (reason !== null) {
      out.push({
        hash: c.hash,
        shortHash: c.hash.slice(0, 7),
        message: subject,
        reason,
      });
    }
  }
  // Cap at 5 to keep the prompt block tight.
  return out.slice(0, 5);
}

/**
 * Format both signal sets as a single prompt block. Empty when both
 * lists are empty so the caller can unconditionally prepend.
 *
 * The wording instructs the model to surface every line verbatim
 * with the cited file:line or commit hash intact, then optionally
 * add ONE LLM-inferred bullet of nuance. This keeps the Heads Up
 * section deterministic at its core while preserving the model's
 * ability to add real value where the rules can't see.
 */
export function formatHeadsUpSignalsBlock(
  todos: ExtractedTodo[],
  flagged: FlaggedCommit[],
): string {
  if (todos.length === 0 && flagged.length === 0) return "";
  const lines: string[] = [];
  lines.push("## Detected Heads Up Signals (verbatim from the user's own code and commits)");
  lines.push(
    "Use these as the primary content of the AI Context \"Heads Up\" section. Surface every item below as a bullet, preserving file paths, line numbers, and commit hashes EXACTLY as written. Do NOT paraphrase or merge them. After the verbatim items, you may add at most ONE additional bullet of nuance you inferred from the diffs (label it as inferred or omit it if nothing specific applies).",
  );
  if (todos.length > 0) {
    lines.push("");
    lines.push("Code comments the user added in this digest:");
    for (const t of todos) {
      const txt = t.text.length > 0 ? `${t.marker}: ${t.text}` : t.marker;
      lines.push(`- ${t.file}:${t.line} — ${txt}`);
    }
  }
  if (flagged.length > 0) {
    lines.push("");
    lines.push("Commits the user labeled as risky or unfinished:");
    for (const f of flagged) {
      lines.push(`- [${f.shortHash}] "${f.message}"`);
    }
  }
  lines.push("");
  return lines.join("\n");
}
