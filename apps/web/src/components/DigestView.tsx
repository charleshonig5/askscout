"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/components/Toast";
import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import {
  Copy,
  Check,
  Download,
  Send,
  Sparkles,
  BookText,
  Forward,
  LayoutList,
  FileText,
  GitCommitHorizontal,
  ChartNoAxesCombined,
} from "lucide-react";
import { useCountUp, useCountTransition } from "@/lib/use-count-up";
import { parseSections } from "@/lib/parse-sections";
import {
  SectionSkeleton,
  SidebarSkeleton,
  SECTION_SKELETONS,
  SIDEBAR_SECTION_KEYS,
} from "@/components/PreGeneration";
import { Emoji } from "@/components/Emoji";
import { DigestOpener } from "@/components/DigestOpener";
import { TapTooltipSpan } from "@/components/TapTooltipSpan";

/**
 * Build the markdown that feeds both the clipboard Copy button and the
 * .md download. Renders proper CommonMark so when the user pastes into
 * GitHub / Notion / Linear / Slack / Obsidian / VS Code preview, they
 * see the same hierarchy and emphasis the dashboard shows on screen.
 *
 * Goals:
 *   1. Match on-screen render order exactly (narrative → stats → takeaway)
 *      so the paste reads top-to-bottom the same way the dashboard does.
 *   2. Strip private sections (Standup, Plan, AI Context, Summary) — those
 *      are accessed via their own modals, never via Copy / Download.
 *   3. Real markdown semantics throughout: H1 title, H2 section headers,
 *      H3 stats sub-sections, `-` bullets with bold titles, backticked
 *      file paths, bold emphasis on hero numbers (cards line, Pace Check
 *      multiplier, Codebase Health labels).
 *   4. Respect the user's section toggles from settings.
 */
/**
 * Build the digest export. Two output formats share the same structure
 * so the section order and content are identical across surfaces:
 *
 *   - "markdown" (used by the .md Download): real markdown with `##`
 *     section headers, `**bold**` for cards/subtitles, `### Sub`
 *     headings inside Statistics, backticks around file paths.
 *     Renders cleanly in any markdown viewer (GitHub, Notion,
 *     VS Code, etc).
 *
 *   - "text" (used by the Copy button): plain text with section
 *     emojis as the only header marker. No `##`, no `**`, no `###`.
 *     Pastes cleanly into Slack, email, notes apps, and any context
 *     that does not render markdown.
 *
 * Section order across both formats: header → narrative (Vibe Check,
 * Shipped, Changed, Still Shifting, Left Off, Field Notes) → Key
 * Takeaways → Statistics block. Key Takeaways sits between the
 * narrative and the reference data so the editorial close lands
 * before the stats.
 */
function buildFullMarkdown(
  text: string,
  stats?: DigestViewStats | null,
  visibleSections?: Record<string, boolean>,
  repoName?: string,
  format: "markdown" | "text" = "text",
): string {
  const isVisible = (key: string) => !visibleSections || visibleSections[key] !== false;
  const fmt = (n: number) => n.toLocaleString("en-US");
  const md = format === "markdown";
  const h1 = (s: string) => (md ? `# ${s}` : s);
  const h2 = (s: string) => (md ? `## ${s}` : s);
  const h3 = (s: string) => (md ? `### ${s}` : s);
  const bold = (s: string) => (md ? `**${s}**` : s);
  const code = (s: string) => (md ? `\`${s}\`` : s);

  // 1. Strip private sections (---STANDUP---, ---PLAN---, etc).
  const digestOnly = parseSections(text).digest;

  // 2. Parse the narrative into structured sections so we can filter
  //    out anything the user has toggled off in settings. Key Takeaways
  //    is pulled out so we can place it BETWEEN Field Notes and the
  //    Statistics block — narrative + editorial close + reference data,
  //    in that order.
  const parsedNarrative = parseStreamingSections(digestOnly);
  const narrativeBlocks: string[] = [];
  let keyTakeawaysBlock: string | null = null;

  for (const sec of parsedNarrative) {
    const settingsKey = sectionKeyMap[sec.key] ?? sec.key;
    if (!isVisible(settingsKey)) continue;
    if (sec.key === "stats") continue; // dead path — stats live in sidebar block

    const body = formatNarrativeBody(sec.key, sec.content, format);
    if (!body) continue;
    const block = `${h2(`${sec.emoji} ${sec.label}`)}\n\n${body}`;

    if (sec.key === "takeaway") {
      keyTakeawaysBlock = block;
    } else {
      narrativeBlocks.push(block);
    }
  }

  // 3. Statistics block — sub-section headings + cards row + file rows.
  //    Sub-headings use ### in markdown mode and plain text in text
  //    mode. Cards row is bold in markdown mode so it reads as the
  //    headline stat under the Statistics umbrella.
  const statsBlocks: string[] = [];

  if (stats && isVisible("statistics") && stats.commits != null) {
    const cards = `+${fmt(stats.linesAdded ?? 0)} lines · -${fmt(
      stats.linesRemoved ?? 0,
    )} lines · ${fmt(stats.commits)} commits · ${fmt(stats.filesChanged ?? 0)} files`;
    statsBlocks.push(bold(cards));
  }

  if (stats && isVisible("mostActiveFiles") && (stats.topFiles?.length ?? 0) > 0) {
    const rows = stats.topFiles!.map(
      (f, i) =>
        `${i + 1}. ${code(f.file)} (+${fmt(f.added ?? 0)} / -${fmt(f.removed ?? 0)}, ${f.commits} ${
          f.commits === 1 ? "commit" : "commits"
        })`,
    );
    statsBlocks.push(`${h3("Most Active Files")}\n\n${rows.join("\n")}`);
  }

  if (
    stats &&
    isVisible("codebaseHealth") &&
    stats.health?.growth?.level &&
    stats.health.focus?.level &&
    stats.health.churn?.level
  ) {
    const h = stats.health;
    statsBlocks.push(
      [
        h3("Codebase Health"),
        "",
        `- ${bold("Growth:")} ${h.growth.level} (+${fmt(h.growth.added)} / -${fmt(h.growth.removed)})`,
        `- ${bold("Focus:")} ${h.focus.level} (${h.focus.filesPerCommit} files touched per commit)`,
        `- ${bold("Churn:")} ${h.churn.level} (${h.churn.files} ${h.churn.files === 1 ? "file" : "files"} reworked)`,
      ].join("\n"),
    );
  }

  if (stats && isVisible("whenYouCoded") && stats.timeline && stats.timeline.points.length > 0) {
    const fmtT = (ms: number) =>
      new Date(ms)
        .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        .toLowerCase();
    const count = stats.timeline.points.length;
    const commitsLabel = `${count} ${count === 1 ? "commit" : "commits"}`;
    const timeRange =
      stats.timeline.startMs === stats.timeline.endMs
        ? fmtT(stats.timeline.startMs)
        : `${fmtT(stats.timeline.startMs)} to ${fmtT(stats.timeline.endMs)}`;
    statsBlocks.push(`${h3("Coding Timeline")}\n\n${timeRange} · ${commitsLabel}`);
  }

  if (stats && isVisible("paceCheck") && stats.pace && typeof stats.pace.multiplier === "number") {
    statsBlocks.push(
      [
        h3("Pace Check"),
        "",
        `${bold(`${stats.pace.multiplier}x`)} · ${stats.pace.label}`,
        `${stats.pace.todayCommits} commits today · ${stats.pace.avgCommits}-commit avg`,
      ].join("\n"),
    );
  }

  const sidebarBlock =
    statsBlocks.length > 0 ? `${h2("\u{1F4CA} Statistics")}\n\n${statsBlocks.join("\n\n")}` : "";

  // 4. Title + metadata header. In markdown mode the repo name is the
  //    H1 and the date is bold; in text mode they're just two plain
  //    lines so the export reads clean in any context.
  const titleLine = h1(repoName ?? "Digest");
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const headerBlock = `${titleLine}\n${bold(dateStr)}`;

  // 5. Final assembly. Order: header → narrative → Key Takeaways
  //    → Statistics. Trailing newline so the file ends cleanly.
  const allBlocks: string[] = [headerBlock];
  if (narrativeBlocks.length > 0) allBlocks.push(...narrativeBlocks);
  if (keyTakeawaysBlock) allBlocks.push(keyTakeawaysBlock);
  if (sidebarBlock) allBlocks.push(sidebarBlock);

  return allBlocks.join("\n\n").trim() + "\n";
}

/**
 * Render a single narrative section's body as markdown. Bullet sections
 * (Shipped / Changed / Still Shifting / Left Off) become real markdown
 * lists with bold titles, mirroring the on-screen "**Title** - body"
 * layout. Paragraph sections (Vibe Check, Key Takeaways) pass through
 * as prose. Empty sections return an empty string so the caller can
 * skip them entirely.
 */
function formatNarrativeBody(
  key: string,
  content: string,
  format: "markdown" | "text" = "text",
): string {
  const trimmed = content.trim();
  if (!trimmed) return "";

  const md = format === "markdown";
  const bold = (s: string) => (md ? `**${s}**` : s);

  const isBulletSection =
    key === "shipped" || key === "changed" || key === "unstable" || key === "leftOff";

  if (isBulletSection) {
    // Bullets: take only lines starting with a bullet glyph, strip the
    // marker, defensively drop section-emoji false-positives the LLM
    // occasionally repeats. In markdown mode the title is bold; in
    // text mode it's plain so the export reads clean in any plain-text
    // context (Slack, email, notes app).
    const lines = trimmed.split("\n").filter((l) => l.length > 0);
    const items = lines
      .filter((l) => /^\s*[•\-*]/.test(l))
      .map((l) => l.replace(/^\s*[•\-*]\s*/, "").trim())
      .filter((l) => l.length > 0)
      .filter((l) => !SECTION_EMOJI_PREFIX.test(l));

    if (items.length === 0) return "";

    return items
      .map((item) => {
        const { title, context } = splitBulletTitle(item);
        if (title && context) return `- ${bold(title)} - ${context}`;
        return `- ${title || context}`;
      })
      .join("\n");
  }

  // Field Notes content is "subtitle\nbody". Split on the first
  // newline; everything before is the subtitle, everything after is
  // the body paragraph. Strip stray asterisks the LLM emits (Field
  // Notes is plain prose, no emphasis) and collapse mid-body newlines
  // to spaces so the body reads as a single paragraph regardless of
  // where the LLM placed its line breaks. Subtitle is bold in markdown
  // mode, plain in text mode.
  if (key === "fieldNotes") {
    const stripAsterisks = (s: string) => s.replace(/\*([^*\n]+)\*/g, "$1");
    const collapseNewlines = (s: string) => s.replace(/\s*\n+\s*/g, " ").trim();
    const cleaned = stripAsterisks(trimmed);
    const splitIdx = cleaned.indexOf("\n");
    const subtitle = splitIdx === -1 ? cleaned : cleaned.slice(0, splitIdx).trim();
    const body = splitIdx === -1 ? "" : collapseNewlines(cleaned.slice(splitIdx + 1));
    const parts: string[] = [];
    if (subtitle) parts.push(bold(subtitle));
    if (body) parts.push(body);
    return parts.join("\n\n");
  }

  // Vibe Check / Key Takeaways: prose. Collapse mid-paragraph newlines
  // so each section reads as a single flowing paragraph in the export,
  // matching how the rendered web view displays them (where browser
  // whitespace collapsing already handles this naturally).
  return trimmed.replace(/\s*\n+\s*/g, " ");
}

function DownloadBtn({
  text,
  stats,
  repoName,
  visibleSections,
}: {
  text: string;
  stats?: DigestViewStats | null;
  repoName?: string;
  visibleSections?: Record<string, boolean>;
}) {
  const handleDownload = useCallback(() => {
    const name = repoName ?? "digest";
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${name}-${date}.md`;
    const md = buildFullMarkdown(text, stats, visibleSections, repoName, "markdown");

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [text, stats, repoName, visibleSections]);

  return (
    <button className="action-btn" onClick={handleDownload}>
      <Download size={18} strokeWidth={1} /> Download
    </button>
  );
}

function buildTweet(items: string[]): string {
  const MAX_CHARS = 280;
  const suffix = "\n\n#buildinpublic";

  // Use TITLES only (part before " - ") so all shipped items fit in a tweet.
  // The old version included the full context which pushed us over 280 chars
  // fast and the trim loop dropped items until often only one remained.
  const titles = items
    .map((item) => {
      const dashIdx = item.indexOf(" - ");
      if (dashIdx > 0 && dashIdx < 60) {
        return item.slice(0, dashIdx).trim();
      }
      // No " - " separator: take the first sentence, hard-cap at 60 chars.
      const first = item.split(/[.!]/)[0]?.trim() ?? item.trim();
      return first.length > 60 ? first.slice(0, 57) + "..." : first;
    })
    .filter((t) => t.length > 0);

  if (titles.length === 0) return "";

  if (titles.length === 1) {
    return `Just shipped: ${titles[0]} \ud83d\ude80${suffix}`;
  }

  const buildList = (list: string[], totalCount: number, moreCount: number) => {
    const bullets = list.map((t) => `\u2022 ${t}`).join("\n");
    const tail = moreCount > 0 ? `\n\u2022 +${moreCount} more` : "";
    return `Just shipped ${totalCount} things \ud83d\ude80\n${bullets}${tail}${suffix}`;
  };

  let kept = titles.length;
  let tweet = buildList(titles, titles.length, 0);

  // If we're over the cap (e.g., many long titles), trim from the bottom and
  // note how many were dropped so the reader knows there's more.
  while (tweet.length > MAX_CHARS && kept > 1) {
    kept--;
    tweet = buildList(titles.slice(0, kept), titles.length, titles.length - kept);
  }

  // Ultimate fallback: even one title + "+N more" is too long. Hard truncate.
  if (tweet.length > MAX_CHARS) {
    tweet = tweet.slice(0, MAX_CHARS - 3) + "...";
  }

  return tweet;
}

function ShareBtn({ items }: { items: string[] }) {
  const handleShare = useCallback(() => {
    const tweet = buildTweet(items);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [items]);

  return (
    <button className="digest-bulleted-share" onClick={handleShare} aria-label="Share on X">
      Share on X
      <Forward size={10} strokeWidth={1} aria-hidden />
    </button>
  );
}

/**
 * On-demand "Email me this digest" button. Posts to /api/email/digest
 * which renders the DigestEmail React Email template server-side and
 * dispatches via Resend to the GitHub primary email captured during
 * OAuth (user:email scope).
 *
 * Identifier resolution: when a `digestId` is provided (history view
 * passes one), we email that exact row. Otherwise we fall back to
 * (repo, mode, tzOffset) so today's view emails today's digest.
 *
 * UI states: idle ("Email") → sending (spinner-less "Sending…") →
 * success ("Sent" + green-flash, mirrors the Copy button's pattern) →
 * idle after 3s. Failures surface through the global Toast so the
 * button can stay reusable without inventing inline error chrome.
 *
 * Re-auth handling: the API returns `missing_email_scope` for sessions
 * issued before the `user:email` scope was added; we surface a clear
 * toast asking the user to sign out and back in. They only have to
 * do this once.
 */
function EmailBtn({
  digestId,
  repoFullName,
  mode = "digest",
}: {
  digestId?: string | null;
  repoFullName?: string;
  mode?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const { showError } = useToast();

  const handleEmail = useCallback(async () => {
    if (state !== "idle") return;
    setState("sending");
    try {
      const body: Record<string, unknown> = {};
      if (digestId) {
        body.digestId = digestId;
      } else if (repoFullName) {
        body.repo = repoFullName;
        body.mode = mode;
        // tzOffset matches the convention used by /api/digest/today —
        // minutes WEST of UTC, the value Date.getTimezoneOffset returns.
        body.tzOffset = new Date().getTimezoneOffset();
      } else {
        showError("Can't email this view — no digest is loaded yet.");
        setState("idle");
        return;
      }

      // Forward the page URL's ?force=1 flag through to the API so
      // template iteration on a dev / preview deploy can bypass the
      // per-digest hourly rate limit. The API itself only honors the
      // flag in non-prod environments, so wiring it through here is
      // safe.
      const force =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("force") === "1";
      const res = await fetch(`/api/email/digest${force ? "?force=1" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        skipped?: boolean;
        reason?: string;
        error?: string;
        message?: string;
      } | null;

      if (!res.ok) {
        if (res.status === 403 && json?.error === "missing_email_scope") {
          showError(
            json.message ?? "Sign out and back in to grant email permission, then try again.",
          );
        } else if (res.status === 429) {
          showError(json?.message ?? "Already emailed in the last hour.");
        } else {
          showError(json?.error ?? "Couldn't send the email. Try again in a bit.");
        }
        setState("idle");
        return;
      }

      // dev_disabled — API returns 200 with `skipped: true`. Don't pretend we sent.
      if (json?.skipped) {
        showError(json.reason ?? "Email sending is disabled in this environment.");
        setState("idle");
        return;
      }

      setState("sent");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      showError("Network error — couldn't reach the email service.");
      setState("idle");
    }
  }, [state, digestId, repoFullName, mode, showError]);

  return (
    <button
      className={`action-btn ${state === "sent" ? "copied" : ""}`}
      onClick={() => void handleEmail()}
      disabled={state !== "idle"}
    >
      {state === "sent" ? (
        <>
          <Check size={18} strokeWidth={1} /> Sent
        </>
      ) : state === "sending" ? (
        <>
          <Send size={18} strokeWidth={1} /> Sending…
        </>
      ) : (
        <>
          <Send size={18} strokeWidth={1} /> Email
        </>
      )}
    </button>
  );
}

export function DigestActions({
  text,
  stats,
  repoName,
  repoFullName,
  digestId,
  mode = "digest",
  visibleSections,
}: {
  text: string;
  stats?: DigestViewStats | null;
  repoName?: string;
  /** Full "owner/repo" slug needed by the email API to look up
   *  today's digest server-side when no explicit digestId is passed. */
  repoFullName?: string;
  /** Id of the exact digest row being viewed. Required when the user
   *  is looking at a history entry; optional for today's view (the
   *  API falls back to today's digest by repo+mode+tz). */
  digestId?: string | null;
  /** Digest mode key — almost always "digest"; threaded through for
   *  future modes. */
  mode?: string;
  visibleSections?: Record<string, boolean>;
}) {
  return (
    <div className="digest-actions-row">
      <CopyBtn
        text={buildFullMarkdown(text, stats, visibleSections, repoName, "text")}
        label="Copy"
      />
      <DownloadBtn
        text={text}
        stats={stats}
        repoName={repoName}
        visibleSections={visibleSections}
      />
      <EmailBtn digestId={digestId} repoFullName={repoFullName} mode={mode} />
    </div>
  );
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button className={`action-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
      {copied ? (
        <>
          <Check size={18} strokeWidth={1} /> Copied
        </>
      ) : (
        <>
          <Copy size={18} strokeWidth={1} /> {label ?? "Copy"}
        </>
      )}
    </button>
  );
}

// Section markers used in the digest streaming text
const SECTION_MARKERS = [
  { key: "vibe", emoji: "\ud83d\udcac", label: "Vibe Check" },
  { key: "shipped", emoji: "\ud83d\ude80", label: "Shipped" },
  { key: "changed", emoji: "\ud83d\udd27", label: "Changed" },
  { key: "unstable", emoji: "\ud83d\udd01", label: "Still Shifting" },
  { key: "leftOff", emoji: "\ud83d\udccd", label: "Left Off" },
  { key: "fieldNotes", emoji: "\ud83e\udded", label: "Field Notes" },
  { key: "takeaway", emoji: "\ud83d\udd11", label: "Key Takeaways" },
  { key: "stats", emoji: "\ud83d\udcca", label: "Stats" },
] as const;

// Regex matching any line that begins with a section emoji — used defensively
// to filter out LLM-repeated section headers from bullet lists.
const SECTION_EMOJI_PREFIX =
  /^[\u{1F4AC}\u{1F680}\u{1F527}\u{1F501}\u{1F4CD}\u{1F9ED}\u{1F511}\u{1F4CA}]/u;

interface ParsedSection {
  key: string;
  emoji: string;
  label: string;
  content: string;
}

/** Item count next to a bulleted-section heading ("3 items"). Tweens
 *  smoothly from the previous value to the new target whenever the count
 *  changes, so as bullets stream in the number ticks 1 → 2 → 3 instead of
 *  snapping. Snappy 300ms duration since this fires repeatedly during
 *  streaming. */
function BulletedCount({ count, animate }: { count: number; animate: boolean }) {
  const animated = useCountTransition(count, 300, animate);
  const display = Math.round(animated);
  return (
    <span className="digest-bulleted-count">
      {display} {count === 1 ? "item" : "items"}
    </span>
  );
}

/**
 * Split a bulleted-section item into title + context. The LLM is instructed
 * to format every bullet as "Title - body" (Shipped, Changed, Still Shifting,
 * Left Off), but it occasionally drops the title and emits raw prose. This
 * helper guarantees the visual format stays consistent regardless:
 *
 *   1. Preferred: explicit " - " separator from the LLM (60-char cap on the
 *      title side rules out matches inside long body text).
 *   2. Fallback: first sentence used as title if it's a clean 2-8 words.
 *      Catches "Payment form is incomplete. The UI works..." cleanly.
 *   3. Last resort: take the first ~4 words as a title. Less elegant but
 *      keeps the bulleted-list shape uniform.
 *   4. Tiny single-clause bullets (under 5 words) get used wholesale as a
 *      title with no context — there's nothing to split.
 */
/** Capitalize the first letter of a sentence body. The LLM occasionally
 *  emits bullet bodies that begin with a lowercase word (most common in
 *  Left Off, where the model treats the body as a continuation of the
 *  title fragment). Forcing the first character upper keeps the visual
 *  format consistent across all four sections regardless of model
 *  output quirks. */
function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function splitBulletTitle(item: string): { title: string | null; context: string } {
  const dashIdx = item.indexOf(" - ");
  if (dashIdx > 0 && dashIdx < 60) {
    return {
      title: item.slice(0, dashIdx).trim(),
      context: capitalizeFirst(item.slice(dashIdx + 3).trim()),
    };
  }
  const sentenceMatch = item.match(/^([^.!?]{4,60})[.!?]\s+(.+)$/s);
  if (sentenceMatch) {
    const candidate = sentenceMatch[1]!.trim();
    const wordCount = candidate.split(/\s+/).length;
    if (wordCount >= 2 && wordCount <= 8) {
      return { title: candidate, context: capitalizeFirst(sentenceMatch[2]!.trim()) };
    }
  }
  const words = item.trim().split(/\s+/);
  if (words.length >= 5) {
    const title = words
      .slice(0, 4)
      .join(" ")
      .replace(/[,;:.!?]+$/, "");
    const context = capitalizeFirst(words.slice(4).join(" "));
    return { title, context };
  }
  return { title: item.trim(), context: "" };
}

/** Tiny pulsing pill shown on the section currently being streamed. */
function LiveBadge() {
  return (
    <span className="live-badge" aria-label="Currently streaming">
      <span className="live-badge-text">Live</span>
      <span className="live-badge-dot" />
    </span>
  );
}

function parseStreamingSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  for (let i = 0; i < SECTION_MARKERS.length; i++) {
    const marker = SECTION_MARKERS[i]!;
    const searchStr = `${marker.emoji} ${marker.label}`;
    const startIdx = text.indexOf(searchStr);
    if (startIdx === -1) continue;

    const contentStart = startIdx + searchStr.length;

    let endIdx = text.length;
    for (let j = i + 1; j < SECTION_MARKERS.length; j++) {
      const nextMarker = SECTION_MARKERS[j]!;
      const nextSearch = `${nextMarker.emoji} ${nextMarker.label}`;
      const nextIdx = text.indexOf(nextSearch, contentStart);
      if (nextIdx !== -1) {
        endIdx = nextIdx;
        break;
      }
    }

    sections.push({
      key: marker.key,
      emoji: marker.emoji,
      label: marker.label,
      content: text.slice(contentStart, endIdx).trim(),
    });
  }

  return sections;
}

/** Map from SECTION_MARKERS keys to DigestSections keys */
const sectionKeyMap: Record<string, string> = {
  vibe: "vibeCheck",
  shipped: "shipped",
  changed: "changed",
  unstable: "unstable",
  leftOff: "leftOff",
  fieldNotes: "fieldNotes",
  takeaway: "oneTakeaway",
  stats: "statistics",
};

function StreamingDigest({
  text,
  isStreaming,
  showSkeletons = false,
  visibleSections,
}: {
  text: string;
  isStreaming: boolean;
  /** Force-render section skeletons even when isStreaming is false. Used
   *  during the dashboard's bootstrap window (returning from /settings or
   *  /insights) where we want the same skeleton scaffold but without the
   *  streaming-specific chrome (LiveBadge, cursor) the isStreaming flag
   *  would also trigger. */
  showSkeletons?: boolean;
  visibleSections?: Record<string, boolean>;
}) {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const sections = parseStreamingSections(text);
  const isLastSection = (key: string) => {
    const last = sections[sections.length - 1];
    return last?.key === key;
  };

  // Auto-scroll during streaming was removed — it fought users who were
  // reading earlier sections while later ones were still typing in. The
  // cursor still renders for visual feedback; scroll position is left
  // entirely under the user's control.

  const cursor = <span ref={cursorRef} className="streaming-cursor" />;

  return (
    <div>
      {sections.map((section) => {
        // Check if this section is hidden by user preferences
        const settingsKey = sectionKeyMap[section.key];
        if (settingsKey && visibleSections && visibleSections[settingsKey] === false) {
          return null;
        }

        const showCursor = isStreaming && isLastSection(section.key);

        if (section.key === "vibe") {
          return (
            <div key={section.key} className="digest-vibe">
              <div className="digest-vibe-title">
                <Emoji name={section.key} size={20} />
                <span>{section.label}</span>
                {showCursor && <LiveBadge />}
              </div>
              <p className="digest-vibe-body">
                {section.content}
                {showCursor && cursor}
              </p>
            </div>
          );
        }

        if (section.key === "fieldNotes") {
          // Field Notes content is "subtitle\n\nbody" — bold headline on
          // the first line, a blank line, then the 3-4 sentence body
          // paragraph. We split on the first blank-line so the subtitle
          // and body render distinctly (per the Figma editorial treatment).
          //
          // Robust to LLM format drift: \n\n is canonical, single \n is
          // accepted as a fallback, and any stray *asterisks* the LLM
          // emits get stripped (Field Notes is plain prose, no inline
          // emphasis). During streaming, partial content sits in the
          // subtitle slot until the separator arrives.
          // Component owns the structure: emoji header, vertical rule,
          // subtitle slot, body slot. The LLM only fills text. We split
          // on the FIRST newline so line 1 is always the subtitle and
          // everything after it is the body. Stray *asterisks* the LLM
          // emits get stripped because Field Notes has no inline emphasis.
          const stripAsterisks = (s: string) => s.replace(/\*([^*\n]+)\*/g, "$1");
          const cleaned = stripAsterisks(section.content.trim());
          const splitIdx = cleaned.indexOf("\n");
          let subtitle = "";
          let body = "";
          if (splitIdx === -1) {
            // Single line of content. While streaming this is the
            // subtitle still arriving. Once streaming completes
            // with no newline, the LLM violated the two-part
            // contract — recover by splitting on the first
            // sentence boundary so the reader still gets a
            // headline + body presentation instead of an orphan
            // paragraph. Falls back to subtitle-only if the
            // content is one sentence.
            if (showCursor) {
              subtitle = cleaned;
            } else {
              const sentenceMatch = cleaned.match(/^(.+?[.!?])\s+(\S.+)$/s);
              const head = sentenceMatch?.[1];
              const tail = sentenceMatch?.[2];
              if (head && tail) {
                subtitle = head.trim();
                body = tail.trim();
              } else {
                subtitle = cleaned;
              }
            }
          } else {
            subtitle = cleaned.slice(0, splitIdx).trim();
            body = cleaned.slice(splitIdx + 1).trim();
          }
          return (
            <div key={section.key} className="digest-section digest-fieldnotes">
              <div className="digest-fieldnotes-title">
                <Emoji name={section.key} size={20} />
                <span>{section.label}</span>
                {showCursor && <LiveBadge />}
              </div>
              {(subtitle || body) && (
                <div className="digest-fieldnotes-body-row">
                  <div className="digest-fieldnotes-rule" aria-hidden />
                  <div className="digest-fieldnotes-content">
                    {subtitle && <p className="digest-fieldnotes-subtitle">{subtitle}</p>}
                    {body && (
                      <p className="digest-fieldnotes-body">
                        {body}
                        {showCursor && cursor}
                      </p>
                    )}
                    {!body && showCursor && <p className="digest-fieldnotes-body">{cursor}</p>}
                  </div>
                </div>
              )}
            </div>
          );
        }

        if (section.key === "takeaway") {
          return (
            <div key={section.key} className="digest-section digest-takeaway">
              <div className="digest-takeaway-title">
                <Emoji name={section.key} size={20} />
                <span>{section.label}</span>
                {showCursor && <LiveBadge />}
              </div>
              <p className="digest-takeaway-body">
                {section.content}
                {showCursor && cursor}
              </p>
            </div>
          );
        }

        if (section.key === "stats") {
          return (
            <div key={section.key} className="digest-stats">
              {section.content}
              {showCursor && cursor}
            </div>
          );
        }

        const lines = section.content.split("\n").filter((l: string) => l.length > 0);
        // Only keep lines that explicitly start with a bullet character.
        // Defensively strip any line that looks like a section header (starts
        // with one of our section emojis) to handle LLMs that occasionally
        // repeat the header text inside the section content.
        const items = lines
          .filter((l: string) => /^\s*[\u2022\-*]/.test(l))
          .map((l: string) => l.replace(/^\s*[\u2022\-*]\s*/, "").trim())
          .filter((l: string) => l.length > 0)
          .filter((l: string) => !SECTION_EMOJI_PREFIX.test(l));

        return (
          <div key={section.key} className="digest-section digest-bulleted">
            <div className="digest-bulleted-header">
              <div className="digest-bulleted-heading">
                <Emoji name={section.key} size={20} />
                <span className="digest-bulleted-label">{section.label}</span>
                {items.length > 0 && <BulletedCount count={items.length} animate={isStreaming} />}
                {showCursor && <LiveBadge />}
                {section.key === "shipped" && !isStreaming && items.length > 0 && (
                  <ShareBtn items={items} />
                )}
              </div>
            </div>
            <div className="digest-bulleted-list">
              {items.map((item: string, i: number) => {
                const { title, context } = splitBulletTitle(item);
                return (
                  <div key={i} className="digest-item">
                    <span className="digest-item-bullet" aria-hidden />
                    <p className="digest-item-text">
                      {title && <span className="digest-item-title">{title}</span>}
                      {title && context && " - "}
                      {context && <span className="digest-item-context">{context}</span>}
                    </p>
                  </div>
                );
              })}
              {showCursor && (
                <div className="digest-item">
                  <span className="digest-item-bullet" aria-hidden />
                  <p className="digest-item-text">{cursor}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Progressive skeletons: while streaming OR during bootstrap loading,
          render a skeleton for every SECTION_SKELETONS entry that hasn't
          arrived in the parsed sections yet. This prevents the page from
          collapsing when typing starts — skeletons hold space for upcoming
          sections and get replaced in order as their markers appear in
          the stream. Skip sections the user has toggled off in settings. */}
      {(isStreaming || showSkeletons) &&
        SECTION_SKELETONS.filter((shape) => {
          const settingsKey = sectionKeyMap[shape.key];
          if (settingsKey && visibleSections && visibleSections[settingsKey] === false) {
            return false;
          }
          return !sections.some((s) => s.key === shape.key);
        }).map((shape, i) => (
          <SectionSkeleton key={shape.key} shape={shape} animationDelay={i * 60} />
        ))}
    </div>
  );
}

interface HealthIndicator {
  level: string;
}

interface HealthData {
  growth: HealthIndicator & { ratio: number; added: number; removed: number };
  focus: HealthIndicator & { filesPerCommit: number };
  churn: HealthIndicator & { files: number };
}

interface TopFile {
  file: string;
  commits: number;
  added?: number;
  removed?: number;
}

export interface DigestViewStats {
  commits: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  filesAdded?: number;
  filesDeleted?: number;
  health?: HealthData;
  topFiles?: TopFile[];
  netImpact?: number;
  sessions?: string[];
  activeDays?: string[];
  pace?: { multiplier: number; label: string; todayCommits: number; avgCommits: number } | null;
  timeline?: {
    startMs: number;
    endMs: number;
    points: Array<{ timeMs: number; lines: number; added?: number; removed?: number }>;
  } | null;
}

function StatsCards({ stats, animate = true }: { stats: DigestViewStats; animate?: boolean }) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  const added = useCountUp(stats.linesAdded, 1000, animate);
  const removed = useCountUp(stats.linesRemoved, 1000, animate);
  const commits = useCountUp(stats.commits, 1000, animate);
  const files = useCountUp(stats.filesChanged, 1000, animate);
  return (
    <div className="stats-quick">
      <span className="stats-quick-added">+{fmt(added)} lines</span>
      {stats.linesRemoved > 0 && <span className="stats-quick-removed">-{fmt(removed)} lines</span>}
      <span className="stats-quick-item">
        <GitCommitHorizontal size={16} strokeWidth={1} className="commit-icon" aria-hidden />
        {fmt(commits)} commits
      </span>
      <span className="stats-quick-item">
        <FileText size={12} strokeWidth={1} className="file-icon" aria-hidden />
        {fmt(files)} Files
      </span>
    </div>
  );
}

function PaceCard({
  pace,
  animate = true,
  animationDelay = "1000ms",
}: {
  pace: { multiplier: number; label: string; todayCommits: number; avgCommits: number };
  animate?: boolean;
  animationDelay?: string;
}) {
  const multiplier = useCountUp(pace.multiplier, 1000, animate, 1);
  // Above 1.0× reads as "speeding up" → success green. At or below = neutral
  // white. Matches the Figma mock which shows the 1.7× hero in success green.
  const isAbove = pace.multiplier >= 1.0;
  return (
    <div className="pace stats-reveal-item" style={{ animationDelay }}>
      {/* Hero card — Figma node 156:255. Bordered inner panel with
          the multiplier stacked over the static unit phrase. Same
          panel chrome as .settings-panel (border, bg, inset glow)
          but tighter padding so it reads as a "stat callout"
          rather than a section card. Width hugs content. */}
      <div className="pace-hero-card">
        <span className={`pace-multiplier${isAbove ? " pace-multiplier--up" : ""}`}>
          {multiplier.toFixed(1)}x
        </span>
        <span className="pace-context">Your normal pace</span>
      </div>
      {/* Editorial message + stats row group beneath the hero card.
          Tighter 8px gap inside the group; outer 14px gap between
          group and hero card matches Figma 156:254. */}
      <div className="pace-meta">
        <p className="pace-message">{pace.label}</p>
        <div className="pace-stats">
          <span className="pace-stat">
            <GitCommitHorizontal size={16} strokeWidth={1} className="commit-icon" aria-hidden />
            {pace.todayCommits} commits today
          </span>
          <span className="pace-stat">
            <ChartNoAxesCombined size={16} strokeWidth={1} className="commit-icon" aria-hidden />
            {pace.avgCommits} commit avg
          </span>
        </div>
      </div>
    </div>
  );
}

type TimelinePoint = { timeMs: number; lines: number; added?: number; removed?: number };

function TimelineBar({
  targetHeight,
  centerPct,
  edgeClass,
  isTapOpen,
  animate,
  onClick,
  children,
}: {
  targetHeight: number;
  centerPct: number;
  edgeClass: string;
  isTapOpen: boolean;
  animate: boolean;
  onClick: (e: ReactMouseEvent) => void;
  children: ReactNode;
}) {
  const [height, setHeight] = useState(animate ? 0 : targetHeight);
  useEffect(() => {
    if (!animate) {
      setHeight(targetHeight);
      return;
    }
    const t = setTimeout(() => setHeight(targetHeight), 1300);
    return () => clearTimeout(t);
  }, [targetHeight, animate]);
  return (
    <div
      className={`timeline-bar${edgeClass}${isTapOpen ? " tap-open" : ""}`}
      style={{
        left: `${centerPct}%`,
        bottom: "14px",
        height: `${height}px`,
        transition: animate ? "height 800ms ease-out, opacity 0.15s ease" : undefined,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function WhenYouCoded({
  timeline,
  animate = true,
}: {
  timeline: { startMs: number; endMs: number; points: Array<TimelinePoint> };
  animate?: boolean;
}) {
  // Touch-device tap-to-pin for the bar tooltips. Single string tracks which
  // bar (if any) is pinned open; tapping anywhere else or the same bar closes.
  const [openBarKey, setOpenBarKey] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openBarKey) return;
    const handler = (e: Event) => {
      const target = e.target as Node | null;
      if (target && trackRef.current && !trackRef.current.contains(target)) {
        setOpenBarKey(null);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [openBarKey]);

  // Auto-dismiss the pinned bar after 4s so a tap-opened tooltip
  // never feels stuck on mobile. Matches the useTapTooltip hook's
  // AUTO_DISMISS_MS. The timer resets every time openBarKey changes
  // (re-tap, new bar, manual close) thanks to the effect's deps.
  useEffect(() => {
    if (!openBarKey) return;
    const id = window.setTimeout(() => setOpenBarKey(null), 4000);
    return () => window.clearTimeout(id);
  }, [openBarKey]);

  if (timeline.points.length === 0) return null;

  // Single commit edge case — startMs === endMs. Center the bar at 50%.
  const isSinglePoint = timeline.startMs === timeline.endMs;
  const span = isSinglePoint ? 1 : timeline.endMs - timeline.startMs;

  // Walk the span in calendar-day chunks. Produces one segment per local day
  // touched by the timeline. DST-safe (uses setDate, not 24h math).
  type DaySeg = {
    dayName: string;
    startMs: number;
    endMs: number;
    leftPct: number;
    rightPct: number;
  };
  // Day-name formatter for the timeline axis. Renders as "Thu, Apr 12"
  // (short weekday + short month + numeric day) so each segment shows
  // exactly which day it represents — not just "Thursday" floating in
  // space with no calendar context.
  const fmtDayName = (ms: number) =>
    new Date(ms).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

  const daySegments: DaySeg[] = [];
  if (isSinglePoint) {
    daySegments.push({
      dayName: fmtDayName(timeline.startMs),
      startMs: timeline.startMs,
      endMs: timeline.endMs,
      leftPct: 0,
      rightPct: 100,
    });
  } else {
    let segStart = timeline.startMs;
    const cursor = new Date(timeline.startMs);
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() + 1); // first midnight after startMs's day-start
    while (cursor.getTime() < timeline.endMs) {
      const segEnd = cursor.getTime();
      if (segEnd > segStart) {
        daySegments.push({
          dayName: fmtDayName(segStart),
          startMs: segStart,
          endMs: segEnd,
          leftPct: ((segStart - timeline.startMs) / span) * 100,
          rightPct: ((segEnd - timeline.startMs) / span) * 100,
        });
        segStart = segEnd;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    daySegments.push({
      dayName: fmtDayName(segStart),
      startMs: segStart,
      endMs: timeline.endMs,
      leftPct: ((segStart - timeline.startMs) / span) * 100,
      rightPct: 100,
    });
  }

  // Floor each day segment's visual width so a day with 30 minutes
  // of activity doesn't render as an unreadable sliver. The natural
  // proportional layout makes "Sun 12pm-10pm + Mon 8am" look like
  // "10-hour bar | almost nothing", which clips the dayName label
  // and hides the single commit. After this pass every day gets at
  // least MIN_PCT of the track; donor segments (those above the
  // floor) shrink proportionally from their excess so total stays
  // at 100%.
  //
  // MIN_PCT scales with day count so it never overflows: pick 25%
  // as the baseline (enough to fit "Mon, May 11" + breathing room
  // at the typical stats column widths on desktop ~390px and mobile
  // ~300px), and cap at 90/N so all minimums combined leave at
  // least 10% headroom for donor segments to live in.
  // N=2  → 25% floor (worst case 75/25 split)
  // N=3  → 25% floor (e.g. 50/25/25)
  // N=4  → 22.5% floor (90/4 = 22.5 < 25)
  // N=5+ → 90/N floor (18% / 15% / ...)
  //
  // startMs / endMs of each segment are NOT touched — only the
  // visual leftPct / rightPct change. Bin time-allocation uses real
  // time (segSpan = endMs - startMs) so a tiny day still gets its
  // minimum 2-bin allocation; those bins now render across a
  // readable visual width instead of being crushed into a sliver.
  if (daySegments.length > 1) {
    const N = daySegments.length;
    const MIN_PCT = Math.min(25, 90 / N);
    const widths = daySegments.map((s) => s.rightPct - s.leftPct);
    const needsExpand = widths.map((w) => w < MIN_PCT);
    const expansionNeeded = widths.reduce(
      (sum, w, i) => sum + (needsExpand[i] ? MIN_PCT - w : 0),
      0,
    );
    if (expansionNeeded > 0) {
      const donorExcess = widths.reduce(
        (sum, w, i) => sum + (!needsExpand[i] ? Math.max(0, w - MIN_PCT) : 0),
        0,
      );
      // Skip the rebalance if donors don't have enough excess to
      // give (every segment is already near the floor) — at that
      // point the proportional layout is already close to equal-
      // width and the rebalance would just churn percentages.
      if (donorExcess >= expansionNeeded) {
        const shrinkRatio = expansionNeeded / donorExcess;
        const newWidths = widths.map((w, i) => {
          if (needsExpand[i]) return MIN_PCT;
          const excess = Math.max(0, w - MIN_PCT);
          return w - excess * shrinkRatio;
        });
        let acc = 0;
        daySegments.forEach((seg, i) => {
          seg.leftPct = acc;
          acc += newWidths[i] ?? 0;
          seg.rightPct = acc;
        });
      }
    }
  }

  const crossesDay = daySegments.length > 1;
  const breakPercents = daySegments.slice(0, -1).map((s) => s.rightPct);

  // Tooltip formatter — keeps minutes for precision on hover. Day prefix is
  // abbreviated ("Wed" not "Wednesday") so the tooltip stays compact.
  const fmtTime = (ms: number) => {
    const d = new Date(ms);
    const time = d
      .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      .toLowerCase();
    if (!crossesDay) return time;
    const day = d.toLocaleDateString("en-US", { weekday: "short" });
    return `${day} ${time}`;
  };

  // Bottom-label formatter — rounds to the nearest hour. Keeps the axis uncluttered.
  // 9:14am → 9am · 2:30pm → 3pm · 7:46pm → 8pm · midnight → 12am · noon → 12pm
  const fmtHour = (ms: number) => {
    const d = new Date(ms);
    if (d.getMinutes() >= 30) d.setHours(d.getHours() + 1);
    d.setMinutes(0, 0, 0);
    let h = d.getHours();
    const ampm = h < 12 ? "am" : "pm";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}${ampm}`;
  };

  // Precise time formatter — used for narrow spans where hour-rounding would
  // collapse every label to the same value (e.g. three "10am"s for a 15-min burst).
  // 10:05am · 10:20am · 12:45pm
  const fmtTimePrecise = (ms: number) => {
    const d = new Date(ms);
    const hour24 = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hour24 < 12 ? "am" : "pm";
    let hour = hour24 % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minutes.toString().padStart(2, "0")}${ampm}`;
  };

  // If the single-day span is narrow, hour-rounding would duplicate labels.
  // Switch to precise times + drop the middle label once span < 3 hours.
  const spanHours = span / (1000 * 60 * 60);
  const useNarrowLabels = !crossesDay && spanHours < 3 && !isSinglePoint;

  // ── Histogram binning ──────────────────────────────────────────────────
  // Visually identical to the old Coding Timeline: black vertical bars on
  // a horizontal baseline, midnight gaps for multi-day, same tooltip feel.
  // What changed is the data model underneath — instead of one column per
  // commit (which bunched into overlapping dots on busy days), we render
  // one bar per time bin and scale its HEIGHT by total lines changed in
  // that bin. Bar WIDTH is fixed at 4px in CSS (.timeline-bar) so every
  // bar is visually identical in thickness across every digest and
  // viewport.
  //
  // Multi-day rule: bins NEVER cross midnight. Each day segment gets its
  // own set of bins allocated proportional to the segment's share of the
  // total span (min 2 bins per segment so a short day isn't collapsed).
  // Bin positions are expressed as a `centerPct` on the full track, using
  // each segment's leftPct/rightPct so bins stay inside their day's visual
  // range — and the midnight gap between segments stays visually clean.
  //
  // Baseline-gap percent for midnight breaks in multi-day digests.
  // Declared up here (not at the bottom near the segment-build loop)
  // because the bin-allocation forEach below reads `half` to clamp
  // bins inside the rendered baseline edges. Reading `half` before
  // its declaration site triggers a Temporal Dead Zone error at
  // runtime — keep these declarations ABOVE the first forEach that
  // uses them.
  // 7% reads as ~22px on the stats-column width: clear breathing
  // room with the labels cleanly on the baseline side of the break.
  const GAP_PCT = 7;
  const half = GAP_PCT / 2;

  // TOTAL_BINS controls the chart's temporal resolution. On a typical
  // ~390px track with 4px bars:
  //   16 bins → ~20.5px gap (sparse, "pin dots")
  //   24 bins → ~12.25px gap (moderate, clearly discrete)
  //   32 bins → ~8.2px gap (dense, reads as a real histogram) ← here
  //   40 bins → ~5.75px gap (continuous waveform, ruler-row risk)
  // 32 is the sweet spot: bursts isolate as tall spikes against
  // shorter neighbors (instead of averaging within wider bins), the
  // silhouette reads as a profile of the day, and we're still well
  // clear of the ruler-row threshold for typical workdays
  // (10–50 commits). Multi-day digests stay safe — 32 bins across
  // 3 days is ~10 bins/day after midnight gaps.
  const TOTAL_BINS = 32;

  type Bin = {
    startMs: number;
    endMs: number;
    centerPct: number;
    commitCount: number;
    totalAdded: number;
    totalRemoved: number;
    totalLines: number;
  };

  const bins: Bin[] = [];

  if (isSinglePoint) {
    // Degenerate case: one narrow bar centered at 50% (a single moment, not
    // a wall). All commits share that single bucket.
    const added = timeline.points.reduce((s, p) => s + (p.added ?? 0), 0);
    const removed = timeline.points.reduce((s, p) => s + (p.removed ?? 0), 0);
    const lines = timeline.points.reduce((s, p) => s + p.lines, 0);
    bins.push({
      startMs: timeline.startMs,
      endMs: timeline.endMs,
      centerPct: 50,
      commitCount: timeline.points.length,
      totalAdded: added,
      totalRemoved: removed,
      totalLines: lines,
    });
  } else {
    // Allocate bins to each day segment proportional to its span share.
    // Run this allocation loop explicitly so rounding leftovers always go
    // to the last segment — prevents total drift from TOTAL_BINS.
    const segmentBinCounts: number[] = [];
    let allocated = 0;
    daySegments.forEach((seg, i) => {
      const isLast = i === daySegments.length - 1;
      if (isLast) {
        segmentBinCounts.push(Math.max(2, TOTAL_BINS - allocated));
      } else {
        const segSpan = seg.endMs - seg.startMs;
        const count = Math.max(2, Math.round((segSpan / span) * TOTAL_BINS));
        segmentBinCounts.push(count);
        allocated += count;
      }
    });

    // Build bins within each segment. Crucially, centerPct is clamped
    // to the RENDERED BASELINE edges — not the raw day-segment bounds —
    // so bins never land inside the midnight gap where no baseline
    // exists. Non-first segments start half-a-gap in from their
    // leftPct; non-last segments end half-a-gap before their rightPct.
    daySegments.forEach((seg, segIdx) => {
      const count = segmentBinCounts[segIdx]!;
      const isFirst = segIdx === 0;
      const isLast = segIdx === daySegments.length - 1;
      const baselineLeft = isFirst ? seg.leftPct : seg.leftPct + half;
      const baselineRight = isLast ? seg.rightPct : seg.rightPct - half;
      const baselineWidth = baselineRight - baselineLeft;
      const segSpanMs = seg.endMs - seg.startMs;
      const binMs = segSpanMs / count;
      const binWidthPct = baselineWidth / count;
      for (let i = 0; i < count; i++) {
        bins.push({
          startMs: seg.startMs + i * binMs,
          endMs: seg.startMs + (i + 1) * binMs,
          centerPct: baselineLeft + (i + 0.5) * binWidthPct,
          commitCount: 0,
          totalAdded: 0,
          totalRemoved: 0,
          totalLines: 0,
        });
      }
    });

    // Place commits. Walk bins in order; inclusive start, exclusive end
    // except for the final bin which captures a commit at exactly endMs.
    for (const p of timeline.points) {
      for (let i = 0; i < bins.length; i++) {
        const bin = bins[i]!;
        const isFinalBin = i === bins.length - 1;
        const inRange = isFinalBin
          ? p.timeMs >= bin.startMs && p.timeMs <= bin.endMs
          : p.timeMs >= bin.startMs && p.timeMs < bin.endMs;
        if (inRange) {
          bin.commitCount += 1;
          bin.totalAdded += p.added ?? 0;
          bin.totalRemoved += p.removed ?? 0;
          bin.totalLines += p.lines;
          break;
        }
      }
    }
  }

  // Only render bins that actually have commits.
  const activeBins = bins.filter((b) => b.commitCount > 0);

  // Bar height scales by the biggest ACTIVE bin so the tallest bar always
  // hits the ceiling. Cap against one massive bin dominating the chart.
  const maxBinLines = Math.max(...activeBins.map((b) => b.totalLines), 1);
  // Track is 82px; bars bottom at 14px (8px float above the 4px baseline
  // at bottom:2). Max 60 keeps 8px of headroom at the top so the
  // tallest bar breathes clear of the track ceiling.
  const MAX_BAR_HEIGHT = 60;
  const MIN_BAR_HEIGHT = 6;
  const barHeight = (lines: number) => {
    const ratio = Math.min(lines / maxBinLines, 1);
    return Math.max(MIN_BAR_HEIGHT, ratio * MAX_BAR_HEIGHT);
  };

  // Split the baseline at each midnight so day-changes show as a
  // visible gap. Time labels anchor to the edges of their segment
  // (flex space-between) — AND their segment container is clamped
  // to the baseline edge above — so this gap doubles as the minimum
  // distance between the end-of-day-N label and the start-of-day-
  // (N+1) label. GAP_PCT and `half` are declared near the top of the
  // function (above the bin-allocation forEach that also reads
  // `half`); see the comment up there for the TDZ rationale.
  const baselineSegments: Array<{ left: number; right: number }> = [];
  let prev = 0;
  for (const bp of breakPercents) {
    baselineSegments.push({ left: prev, right: bp - half });
    prev = bp + half;
  }
  baselineSegments.push({ left: prev, right: 100 });

  return (
    <div className="when-you-coded">
      <div className="timeline-track" ref={trackRef}>
        {baselineSegments.map((seg, i) => (
          <div
            key={`baseline-${i}`}
            className="timeline-baseline"
            style={{ left: `${seg.left}%`, right: `${100 - seg.right}%` }}
          />
        ))}
        {/* Boundary ticks at each segment's start + end — 8px vertical
            hairlines that straddle the baseline (Figma node 52:1485). */}
        {baselineSegments.flatMap((seg, i) => [
          <div key={`tick-l-${i}`} className="timeline-tick" style={{ left: `${seg.left}%` }} />,
          <div key={`tick-r-${i}`} className="timeline-tick" style={{ left: `${seg.right}%` }} />,
        ])}
        {activeBins.map((bin, i) => {
          // Bar is positioned at bin.centerPct (its slot center within the
          // track). Width is locked at 4px by CSS (.timeline-bar) so all
          // bars have identical thickness — only height encodes data.
          const h = barHeight(bin.totalLines);
          const barKey = `bin-${i}-${bin.startMs}`;
          const isTapOpen = openBarKey === barKey;
          // Edge-aware tooltip anchoring: bars near the start/end of the
          // track anchor their tooltip to that edge so it doesn't clip.
          const edgeClass =
            bin.centerPct < 15
              ? " timeline-bar--edge-left"
              : bin.centerPct > 85
                ? " timeline-bar--edge-right"
                : "";
          const hasDetailedStats = bin.totalAdded > 0 || bin.totalRemoved > 0;
          const sameTime = bin.startMs === bin.endMs;
          return (
            <TimelineBar
              key={barKey}
              targetHeight={h}
              centerPct={bin.centerPct}
              edgeClass={edgeClass}
              isTapOpen={isTapOpen}
              animate={animate}
              onClick={(e) => {
                e.stopPropagation();
                setOpenBarKey((prev) => (prev === barKey ? null : barKey));
              }}
            >
              <div className="timeline-tooltip" role="tooltip">
                <div className="timeline-tooltip-lines">
                  {bin.commitCount} {bin.commitCount === 1 ? "commit" : "commits"}
                  {hasDetailedStats ? (
                    <>
                      {" \u00b7 "}
                      <span className="timeline-tooltip-added">
                        +{bin.totalAdded.toLocaleString()}
                      </span>
                      {" / "}
                      <span className="timeline-tooltip-removed">
                        -{bin.totalRemoved.toLocaleString()}
                      </span>
                    </>
                  ) : bin.totalLines > 0 ? (
                    // Old stored digests carry only `lines` (no +/- split).
                    // Fall back to the total so the tooltip is never empty.
                    <>
                      {" \u00b7 "}
                      {bin.totalLines.toLocaleString()} {bin.totalLines === 1 ? "line" : "lines"}
                    </>
                  ) : null}
                </div>
                <div className="timeline-tooltip-time">
                  {sameTime
                    ? fmtTime(bin.startMs)
                    : `${fmtTime(bin.startMs)} \u2013 ${fmtTime(bin.endMs)}`}
                </div>
              </div>
            </TimelineBar>
          );
        })}
      </div>
      {crossesDay ? (
        <div className="timeline-multi-labels">
          {daySegments.map((seg, i) => {
            const isFirst = i === 0;
            const isLast = i === daySegments.length - 1;
            // Clamp each segment's label container to the baseline edges
            // so time labels (anchored via flex space-between) never
            // extend into the midnight gap. Non-first segments start
            // half-a-gap in from their "full day" left; non-last
            // segments end half-a-gap before their "full day" right.
            const labelLeft = isFirst ? seg.leftPct : seg.leftPct + half;
            const labelRight = isLast ? seg.rightPct : seg.rightPct - half;
            const widthPct = labelRight - labelLeft;
            const tooNarrow = widthPct < 10;
            // Filter commits within this segment. Exclusive upper bound on all
            // but the last segment, so a commit at exactly midnight isn't counted
            // twice (it belongs to the next day, not this one).
            const segPoints = timeline.points.filter((p) =>
              isLast
                ? p.timeMs >= seg.startMs && p.timeMs <= seg.endMs
                : p.timeMs >= seg.startMs && p.timeMs < seg.endMs,
            );
            const hasCommits = segPoints.length > 0;
            // Labels reflect ACTUAL first/last commits within the day segment,
            // not the midnight segment boundary. Thursday reads "11am · 7pm"
            // (when coding happened) instead of "12am · 7pm" (boundary).
            const labelStart = hasCommits ? fmtHour(segPoints[0]!.timeMs) : "";
            const labelEnd = hasCommits ? fmtHour(segPoints[segPoints.length - 1]!.timeMs) : "";
            const sameLabel = hasCommits && labelStart === labelEnd;
            return (
              <div
                key={i}
                className="timeline-day-segment"
                style={{
                  left: `${labelLeft}%`,
                  width: `${widthPct}%`,
                }}
              >
                {!tooNarrow && hasCommits && (
                  <div
                    className={
                      sameLabel
                        ? "timeline-segment-times timeline-segment-times--single"
                        : "timeline-segment-times"
                    }
                  >
                    {sameLabel ? (
                      <span>{labelStart}</span>
                    ) : (
                      <>
                        <span>{labelStart}</span>
                        <span>{labelEnd}</span>
                      </>
                    )}
                  </div>
                )}
                <div className="timeline-day-name">{seg.dayName}</div>
              </div>
            );
          })}
        </div>
      ) : (
        (() => {
          // Single-day path. Dedupe identical labels (commits within same rounded
          // minute/hour produce visually redundant labels like "10:05am · 10:05am").
          const dayName = fmtDayName(timeline.startMs);
          if (isSinglePoint) {
            return (
              <div className="timeline-single-labels">
                <div className="timeline-labels timeline-labels--single">
                  <span>{fmtTimePrecise(timeline.startMs)}</span>
                </div>
                <div className="timeline-day-name">{dayName}</div>
              </div>
            );
          }
          if (useNarrowLabels) {
            const a = fmtTimePrecise(timeline.startMs);
            const b = fmtTimePrecise(timeline.endMs);
            return (
              <div className="timeline-single-labels">
                {a === b ? (
                  <div className="timeline-labels timeline-labels--single">
                    <span>{a}</span>
                  </div>
                ) : (
                  <div className="timeline-labels">
                    <span>{a}</span>
                    <span>{b}</span>
                  </div>
                )}
                <div className="timeline-day-name">{dayName}</div>
              </div>
            );
          }
          return (
            <div className="timeline-single-labels">
              <div className="timeline-labels">
                <span>{fmtHour(timeline.startMs)}</span>
                <span>{fmtHour((timeline.startMs + timeline.endMs) / 2)}</span>
                <span>{fmtHour(timeline.endMs)}</span>
              </div>
              <div className="timeline-day-name">{dayName}</div>
            </div>
          );
        })()
      )}
    </div>
  );
}

function TopFiles({
  files,
  repoFullName,
  animate = true,
}: {
  files: TopFile[];
  repoFullName?: string;
  animate?: boolean;
}) {
  if (files.length === 0) return null;

  // Build a GitHub deep-link for a given file path. Use HEAD instead of a
  // specific branch name so this works regardless of whether the repo's
  // default branch is main, master, develop, etc. Encode each path segment
  // individually so spaces/special chars are handled but "/" stays literal.
  const buildGitHubUrl = (file: string): string | null => {
    if (!repoFullName || !/^[^/]+\/[^/]+$/.test(repoFullName)) return null;
    const encodedPath = file.split("/").map(encodeURIComponent).join("/");
    return `https://github.com/${repoFullName}/blob/HEAD/${encodedPath}`;
  };

  return (
    <div className="top-files">
      {files.map((f, i) => {
        const shortName = f.file.split("/").slice(-2).join("/");
        const url = buildGitHubUrl(f.file);
        return (
          <div key={f.file} className="top-file-row">
            <div className="top-file-left">
              <span className="top-file-rank">{i + 1})</span>
              <span className="top-file-name" title={f.file}>
                {shortName}
              </span>
              {url && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="top-file-link"
                  aria-label={`Open ${shortName} on GitHub`}
                >
                  <Forward size={10} strokeWidth={1} aria-hidden />
                </a>
              )}
            </div>
            <TopFileStats
              added={f.added ?? 0}
              removed={f.removed ?? 0}
              commits={f.commits}
              animate={animate}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Right-side numeric block for a single Most Active Files row. Pulled out
 *  so each row can own its own count-up animation hooks. */
function TopFileStats({
  added,
  removed,
  commits,
  animate,
}: {
  added: number;
  removed: number;
  commits: number;
  animate: boolean;
}) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  const addedAnim = useCountUp(added, 1000, animate && added > 0);
  const removedAnim = useCountUp(removed, 1000, animate && removed > 0);
  const commitsAnim = useCountUp(commits, 1000, animate && commits > 0);
  return (
    <div className="top-file-right">
      <span className="top-file-added">+{fmt(addedAnim)}</span>
      <span className="top-file-removed">-{fmt(removedAnim)}</span>
      <TapTooltipSpan
        baseClassName="top-file-commits top-file-commits--tooltip"
        ariaLabel="Commits"
      >
        <GitCommitHorizontal size={16} strokeWidth={1} className="commit-icon" aria-hidden />
        {commitsAnim}
        <span className="top-file-commits-tooltip" role="tooltip">
          Commits
        </span>
      </TapTooltipSpan>
    </div>
  );
}

interface DigestViewProps {
  isStreaming: boolean;
  isLoading?: boolean;
  animate?: boolean;
  streamingText: string;
  stats: DigestViewStats | null;
  repoName?: string;
  // Full "owner/repo" slug — used to build GitHub deep-links on clickable
  // filenames in the Most Active Files section.
  repoFullName?: string;
  visibleSections?: Record<string, boolean>;
  onResumeWithAI?: () => void;
  onGenerateStandup?: () => void;
  onGeneratePlan?: () => void;
}

function levelColor(level: string): string {
  const good = ["Lean", "Tight", "Sharp", "Clean", "Minimal", "Steady"];
  const mid = ["Growing", "Moderate"];
  if (good.includes(level)) return "strong";
  if (mid.includes(level)) return "okay";
  return "rough";
}

/**
 * Discrete 5-step scale per indicator, ordered best → worst.
 * The bar fill width is driven by the level's position on this scale
 * (lower position = lower fill = green; higher position = higher fill
 * = red) so the bar visually tracks severity instead of "goodness".
 */
const LEVEL_ORDER: Record<"Growth" | "Focus" | "Churn", readonly string[]> = {
  Growth: ["Lean", "Steady", "Growing", "Heavy", "Ballooning"],
  Focus: ["Tight", "Sharp", "Moderate", "Wide", "Scattered"],
  Churn: ["Clean", "Minimal", "Moderate", "Noisy", "High"],
};

function levelFillPercent(indicator: "Growth" | "Focus" | "Churn", level: string): number {
  const idx = LEVEL_ORDER[indicator].indexOf(level);
  if (idx < 0) return 20;
  // 5 levels → 20 / 40 / 60 / 80 / 100. Matches the Figma's rough
  // Low / Low-mid / Mid / Mid-high / High progression across states.
  return (idx + 1) * 20;
}

/**
 * Per-level subtitle copy for each Codebase Health card's tertiary-grey
 * second line. One line per level (5 per indicator = 15 total) so the
 * card's story stays precise at every state instead of a binary branch.
 */
const GROWTH_DETAIL: Record<string, string> = {
  Lean: "Balanced adds and cleanup",
  Steady: "Building with steady cleanup",
  Growing: "Mostly adding, light cleanup",
  Heavy: "Build-heavy phase",
  Ballooning: "All build, no cleanup",
};

const FOCUS_DETAIL: Record<string, string> = {
  Tight: "Commits stay on one thing",
  Sharp: "Small, focused commits",
  Moderate: "Commits touch several areas",
  Wide: "Broad commits across areas",
  Scattered: "Commits reach everywhere",
};

const CHURN_DETAIL: Record<string, string> = {
  Clean: "No repeated edits",
  Minimal: "A few files returning",
  Moderate: "Several files getting revisits",
  Noisy: "Many files in rework rotation",
  High: "Heavy repeated iteration",
};

/**
 * Plain-language descriptions for every (category, level) combination.
 * Hover the level badge on a Codebase Health card to see what the rating means.
 * Tone: observational, not preachy. Describes what's happening, not what's wrong.
 */
const HEALTH_DESCRIPTIONS: Record<string, Record<string, string>> = {
  Growth: {
    Lean: "Tight and balanced. About 3\u00d7 additions to removals. Small footprint with steady cleanup.",
    Steady: "Healthy growth. New code paired with real cleanup. A balanced mix.",
    Growing:
      "Mostly building. Additions lead, with some cleanup mixed in. Typical feature-push rhythm.",
    Heavy: "Lots of additions, light on deletions. In a build-heavy phase.",
    Ballooning: "Almost entirely additions. Greenfield work or a focused build sprint.",
  },
  Focus: {
    Tight: "Focused commits. Each one touches a single area. Easy to review and easy to revert.",
    Sharp: "Small, coherent changes across related files. Still quite focused.",
    Moderate: "Commits touching a handful of files. Moderate spread.",
    Wide: "Broader commits reaching across multiple areas.",
    Scattered: "Wide-ranging commits covering many areas in each push.",
  },
  Churn: {
    Clean: "Nothing getting reworked. Features are landing and staying put.",
    Minimal: "A few files returning for revisions. Normal iteration.",
    Moderate: "Several files getting repeat visits. Active rework.",
    Noisy: "A lot of files in rotation for rework. Active iteration phase.",
    High: "Many files being reworked repeatedly. Heavy iteration phase.",
  },
};

/** Health card progress bar. JS-driven so the fill animation is
 *  guaranteed to play on fresh generation regardless of CSS keyframe
 *  quirks. Mounts at width: 0%, schedules a state flip to the real
 *  percent after 1300ms (just past the parent card cascade reveal),
 *  and uses a CSS transition for the visible fill. On revisit
 *  (animate=false) the bar paints at the target width on first render
 *  with no transition so historical digests snap in cleanly. */
function HealthBar({
  percent,
  color,
  animate,
}: {
  percent: number;
  color: string;
  animate: boolean;
}) {
  const [width, setWidth] = useState(animate ? 0 : percent);
  useEffect(() => {
    if (!animate) {
      setWidth(percent);
      return;
    }
    const t = setTimeout(() => setWidth(percent), 1300);
    return () => clearTimeout(t);
  }, [percent, animate]);
  return (
    <div className="health-card-bar">
      <div
        className={`health-card-fill health-card-fill--${color}`}
        style={{
          width: `${width}%`,
          transition: animate ? "width 800ms ease-out" : "none",
        }}
      />
    </div>
  );
}

function CodebaseHealth({ health, animate = true }: { health: HealthData; animate?: boolean }) {
  const fmt = (n: number) => n.toLocaleString("en-US");

  // Count-up animations for numeric values. Two gates: the per-render `animate`
  // flag (false when the user is just clicking through historical digests, so
  // numbers snap in) AND value > 0 (a static "0" is visually quieter than a
  // 0→0 no-op tween).
  const addedAnim = useCountUp(health.growth.added, 1000, animate && health.growth.added > 0);
  const removedAnim = useCountUp(health.growth.removed, 1000, animate && health.growth.removed > 0);
  const filesPerCommitAnim = useCountUp(
    health.focus.filesPerCommit,
    1000,
    animate && health.focus.filesPerCommit > 0,
    1,
  );
  const churnFilesAnim = useCountUp(health.churn.files, 1000, animate && health.churn.files > 0);

  // Touch-device tap-to-pin for the level-description tooltips. A single key
  // tracks which card's tooltip is pinned (at most one at a time).
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openCategory) return;
    const handler = (e: Event) => {
      const target = e.target as Node | null;
      if (target && gridRef.current && !gridRef.current.contains(target)) {
        setOpenCategory(null);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [openCategory]);

  // Auto-dismiss the pinned health-card tooltip after 4s so it
  // doesn't feel stuck on mobile. Mirrors the useTapTooltip hook
  // and the openBarKey timer in CodingTimelineChart — same 4s
  // window, same reset-on-change semantics.
  useEffect(() => {
    if (!openCategory) return;
    const id = window.setTimeout(() => setOpenCategory(null), 4000);
    return () => window.clearTimeout(id);
  }, [openCategory]);

  const indicators = [
    {
      label: "Growth" as const,
      level: health.growth.level,
      stat: `+${fmt(addedAnim)} / -${fmt(removedAnim)}`,
      detail: GROWTH_DETAIL[health.growth.level] ?? "",
    },
    {
      label: "Focus" as const,
      level: health.focus.level,
      stat: `${filesPerCommitAnim.toFixed(1)} files touched per commit`,
      detail: FOCUS_DETAIL[health.focus.level] ?? "",
    },
    {
      label: "Churn" as const,
      level: health.churn.level,
      stat: `${churnFilesAnim} ${health.churn.files === 1 ? "file" : "files"} reworked`,
      detail: CHURN_DETAIL[health.churn.level] ?? "",
    },
  ];

  return (
    <div>
      <div className="health-cards" ref={gridRef}>
        {indicators.map((h) => {
          const color = levelColor(h.level);
          const description = HEALTH_DESCRIPTIONS[h.label]?.[h.level];
          const isTapOpen = openCategory === h.label;
          return (
            <div key={h.label} className="health-card">
              <div className="health-card-top">
                <div className="health-card-identity">
                  <span className="health-card-label">{h.label}</span>
                  <span className="health-card-detail">{h.detail}</span>
                </div>
                <span
                  className={`health-card-level health-card-level--${color}${
                    isTapOpen ? " tap-open" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenCategory((prev) => (prev === h.label ? null : h.label));
                  }}
                >
                  {h.level}
                  {description && (
                    <span className="health-tooltip" role="tooltip">
                      {description}
                    </span>
                  )}
                </span>
              </div>
              <HealthBar
                color={color}
                percent={levelFillPercent(h.label, h.level)}
                animate={animate}
              />

              <div className={`health-card-stat health-card-stat--${h.label.toLowerCase()}`}>
                {h.label === "Growth" ? (
                  <>
                    <span className="health-card-stat-added">+{fmt(addedAnim)} lines</span>
                    <span className="health-card-stat-removed">-{fmt(removedAnim)} lines</span>
                  </>
                ) : (
                  <>
                    <FileText size={12} strokeWidth={1} className="file-icon" aria-hidden />
                    <span>{h.stat}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Right-column sidebar: all five computed stat sections with cascade timing,
 * or skeleton placeholders while streaming is still in progress.
 *
 * Streaming behavior: stats SSE event arrives almost immediately but we hold
 * the skeletons up through the entire streaming phase so the sidebar doesn't
 * compete for attention with the typing narrative on the left. When streaming
 * ends, skeletons unmount and the cascade-animated real cards appear.
 *
 * Empty behavior: if the user has toggled off every stat section OR if stats
 * is null, the sidebar is effectively empty — the parent decides whether to
 * render it at all (collapsing the layout to single column).
 */
function DigestStatsSidebar({
  stats,
  isStreaming,
  animate,
  visibleSections,
  repoFullName,
}: {
  stats: DigestViewStats | null;
  isStreaming: boolean;
  animate: boolean;
  visibleSections?: Record<string, boolean>;
  repoFullName?: string;
}) {
  const vis = (key: string) => !visibleSections || visibleSections[key] !== false;

  // Streaming (or no stats yet): show the umbrella sidebar skeleton.
  // Per Figma (node 138:1151) the sidebar's loading state isn't five
  // independent section skeletons — it's a single "Statistics" header
  // with three generic sub-blocks below. Once stats arrive, this whole
  // unit unmounts and the cascade reveal takes over.
  if (isStreaming || !stats) {
    return (
      <aside className="digest-stats-sidebar">
        <SidebarSkeleton />
      </aside>
    );
  }

  return (
    <aside className="digest-stats-sidebar">
      {/* Umbrella "Statistics" header — one per column, matching the
          Figma frame (node 52:1494). All quantitative sub-sections
          below it are nested under this header with 12px Medium
          sub-headings (no emoji on sub-sections). */}
      <div className="stats-column-header stats-reveal-item" style={{ animationDelay: "0ms" }}>
        <Emoji name="statistics" size={20} />
        <span>Statistics</span>
      </div>

      <div className="stats-column-body">
        {vis("statistics") && stats.commits != null && (
          <div className="stats-reveal-item" style={{ animationDelay: "200ms" }}>
            <StatsCards stats={stats} animate={animate} />
          </div>
        )}

        {vis("mostActiveFiles") && stats.topFiles && stats.topFiles.length > 0 && (
          <div className="stats-subsection stats-reveal-item" style={{ animationDelay: "450ms" }}>
            <div className="stats-subsection-title">Most Active Files</div>
            <TopFiles files={stats.topFiles} repoFullName={repoFullName} animate={animate} />
          </div>
        )}

        {/* Tightened gates: older stored digests can have an
            incomplete stats blob (e.g. health without all three
            indicators, timeline without a points array, pace without
            a numeric multiplier). Without these checks, clicking an
            old digest in the sidebar would crash the whole page. */}
        {vis("codebaseHealth") &&
          stats.health?.growth?.level &&
          stats.health.focus?.level &&
          stats.health.churn?.level && (
            <div className="stats-subsection stats-reveal-item" style={{ animationDelay: "700ms" }}>
              <div className="stats-subsection-title">Codebase Health</div>
              <CodebaseHealth health={stats.health} animate={animate} />
            </div>
          )}

        {vis("whenYouCoded") &&
          stats.timeline &&
          Array.isArray(stats.timeline.points) &&
          stats.timeline.points.length > 0 && (
            <div className="stats-subsection stats-reveal-item" style={{ animationDelay: "950ms" }}>
              <div className="stats-subsection-title">Coding Timeline</div>
              <WhenYouCoded timeline={stats.timeline} animate={animate} />
            </div>
          )}

        {vis("paceCheck") && stats.pace && typeof stats.pace.multiplier === "number" && (
          <div className="stats-subsection stats-reveal-item" style={{ animationDelay: "1200ms" }}>
            <div className="stats-subsection-title">Pace Check</div>
            <PaceCard pace={stats.pace} animate={animate} animationDelay="1350ms" />
          </div>
        )}
      </div>
    </aside>
  );
}

/**
 * Determine whether the sidebar should render at all. Returns false in any
 * case where the sidebar would be empty or useless — the layout then
 * collapses cleanly to single column.
 *
 *   - During streaming: render skeletons if user has ANY section visible.
 *     Even if stats haven't arrived yet, skeletons fill the space.
 *   - After streaming: render only if at least one visible section has
 *     real data. Prevents an empty 360px column for digests that lack a
 *     field (old cached digests, history missing newer stat types).
 */
function sidebarHasContent(
  stats: DigestViewStats | null,
  isStreaming: boolean,
  visibleSections?: Record<string, boolean>,
): boolean {
  const vis = (key: string) => !visibleSections || visibleSections[key] !== false;

  // Pre-streaming / streaming: skeletons just need at least one toggle on.
  if (isStreaming) {
    return SIDEBAR_SECTION_KEYS.some((k) => vis(k));
  }

  // Post-streaming: need actual data in at least one visible section.
  if (!stats) return false;
  return (
    (vis("statistics") && stats.commits != null) ||
    (vis("mostActiveFiles") && (stats.topFiles?.length ?? 0) > 0) ||
    (vis("whenYouCoded") && stats.timeline != null) ||
    (vis("paceCheck") && stats.pace != null) ||
    (vis("codebaseHealth") && stats.health != null)
  );
}

/**
 * Opener phase machine — drives the cross-fade between the editorial opener
 * line ("Reading 12 commits across 3 files…") and the skeleton layout.
 *
 *   "active"  → opener typing/dwelling, skeletons + sidebar suppressed
 *   "fading"  → opener has fired onComplete; running its 320ms opacity fade
 *               while skeletons mount and run their own fade-in animation
 *   "done"    → opener unmounted, normal streaming flow takes over
 */
type OpenerPhase = "active" | "fading" | "done";
const OPENER_FADE_MS = 350;

export function DigestView({
  isStreaming,
  isLoading,
  animate = false,
  streamingText,
  stats,
  repoFullName,
  visibleSections,
  onResumeWithAI,
  onGenerateStandup,
  onGeneratePlan,
}: DigestViewProps) {
  // Opener state. Starts at "done" so cached/loaded digests don't replay
  // the opener — only fresh streams trigger it (see effect below).
  const [openerPhase, setOpenerPhase] = useState<OpenerPhase>("done");
  const wasStreamingRef = useRef(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When a fresh stream kicks off (isStreaming flips false → true with no
  // text yet), arm the opener. We deliberately don't watch streamingText
  // here — if the user re-runs immediately and text has not yet been reset,
  // the wasStreamingRef gate still ensures we only re-arm on a real
  // start-of-stream transition.
  useEffect(() => {
    if (isStreaming && !wasStreamingRef.current) {
      // Cancel any in-flight fade timer from a previous stream.
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      setOpenerPhase("active");
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Cleanup the fade timer if the component unmounts mid-fade.
  useEffect(
    () => () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    },
    [],
  );

  // Called by the opener when it has finished typing + dwelling. We trip
  // the fade and schedule the unmount one fade duration later. During
  // that window, skeletons mount underneath and run their own fade-in,
  // producing a clean cross-fade.
  const handleOpenerComplete = useCallback(() => {
    setOpenerPhase("fading");
    fadeTimerRef.current = setTimeout(() => {
      setOpenerPhase("done");
      fadeTimerRef.current = null;
    }, OPENER_FADE_MS);
  }, []);

  // Unified streaming branch. Five sub-phases live inside it:
  //   0. bootstrap     (isLoading, !isStreaming, !streamingText) → returning
  //                       from /settings or /insights, page is remounting
  //                       and we don't know yet whether we'll show a cached
  //                       digest, stream a fresh one, or hit quiet/empty.
  //                       Render skeletons (no opener — bootstrap is too
  //                       fast to justify a 2s editorial typing line).
  //   1. opener         (isStreaming, !streamingText, openerPhase !== "done")
  //                     → DigestOpener types its line; skeletons + sidebar
  //                       are suppressed so the opener owns the moment.
  //   2. skeletons      (isStreaming, !streamingText, openerPhase === "done")
  //                     → opener has unmounted; SectionSkeleton placeholders
  //                       fade in via their own keyframe; sidebar skeletons
  //                       reveal too.
  //   3. streaming      (isStreaming, streamingText) → sections type in;
  //                       remaining skeletons hold their slots.
  //   4. done           (!isStreaming, streamingText) → final layout with
  //                       cascade-animated sidebar + bottom action buttons.
  //
  // Keeping all phases in ONE render branch lets StreamingDigest stay
  // mounted across phase transitions, avoiding remount flashes.
  if (isLoading || isStreaming || streamingText) {
    // True ONLY during the editorial opener phase: opener typing or fading.
    // Used to suppress skeletons + sidebar so the opener owns the moment.
    const openerVisible = openerPhase !== "done";

    // Treat bootstrap loading the same as streaming for skeleton purposes —
    // both produce the "show placeholders" visual. Kept distinct from the
    // raw isStreaming prop so LiveBadge / cursor (which need the real
    // streaming signal) aren't accidentally turned on during bootstrap.
    const showSkeletonScaffold: boolean = isStreaming || !!isLoading;

    // Decide whether the two-column layout + sidebar render. Suppress them
    // entirely while the opener is on screen — they reveal as the opener
    // fades. Once the opener is done, fall back to the normal data-driven
    // gate (which also handles "all sections hidden" / missing stats).
    const renderSidebar =
      !openerVisible && sidebarHasContent(stats, showSkeletonScaffold, visibleSections);

    return (
      <div className={animate ? "" : "no-animation"}>
        {/* Two-column layout: narrative on the left, stats sidebar on the
            right. Below 1080px the media query flattens this to a single
            column (main first, sidebar below). If renderSidebar is false
            (opener active OR all sections hidden OR no stats post-streaming)
            we skip the sidebar entirely so the layout stays single-column. */}
        <div className={`digest-layout${renderSidebar ? " digest-layout--two-col" : ""}`}>
          <div className="digest-main">
            {/* Editorial opener: types a single line using real stats from
                the SSE stats event. Owns the pre-text moment alone — no
                skeletons, no sidebar — then cross-fades to the streaming
                layout. Unmounts after its fade completes. Gated on
                isStreaming specifically (not isLoading) so the bootstrap
                window doesn't fire a 2s opener for what's typically a
                ~200ms cache check. */}
            {isStreaming && openerVisible && (
              <DigestOpener
                onComplete={handleOpenerComplete}
                fadingOut={openerPhase === "fading"}
              />
            )}

            {/* StreamingDigest is suppressed during the opener phase so
                skeletons don't render alongside the editorial line. As
                soon as the opener finishes (phase: "done"), this mounts
                and either shows skeletons (still pre-text) or the live
                streaming sections. Pass `showSkeletons` so bootstrap
                renders the same skeleton placeholders without flipping
                isStreaming on (which would also light up LiveBadge / the
                streaming cursor — wrong for bootstrap). */}
            {!openerVisible && (
              <StreamingDigest
                text={streamingText}
                isStreaming={isStreaming}
                showSkeletons={!!isLoading}
                visibleSections={visibleSections}
              />
            )}
          </div>

          {renderSidebar && (
            <DigestStatsSidebar
              stats={stats}
              // Pass the combined skeleton-scaffold flag so bootstrap renders
              // the same SidebarSkeleton it uses during fresh streaming.
              // The sidebar doesn't expose any streaming-only chrome, so
              // there's no behavioral leakage from this conflation.
              isStreaming={showSkeletonScaffold}
              animate={animate}
              visibleSections={visibleSections}
              repoFullName={repoFullName}
            />
          )}

          {/* Bottom action buttons. Lives at the LAYOUT level (sibling of
              .digest-main / .digest-stats-sidebar) so on mobile single-
              column it falls below the stats column — matching Figma's
              section 4 placement. On desktop two-col, the grid template
              tucks it into the bottom of the left (main) column with the
              sidebar spanning both rows on the right. Three derivative
              artifacts: AI Resume Prompt (for your AI coding tool),
              Standup (for your team), Todo List (for yourself). AI
              Resume Prompt is first because it's the most distinctive
              value prop. */}
          {!isStreaming && (onResumeWithAI || onGenerateStandup || onGeneratePlan) && (
            <div className="digest-bottom-actions">
              {onResumeWithAI && (
                <button className="standup-btn" onClick={onResumeWithAI}>
                  <Sparkles size={18} strokeWidth={1} aria-hidden />
                  AI Resume Prompt
                </button>
              )}
              {onGenerateStandup && (
                <button className="standup-btn" onClick={onGenerateStandup}>
                  <BookText size={18} strokeWidth={1} aria-hidden />
                  Generate Standup
                </button>
              )}
              {onGeneratePlan && (
                <button className="standup-btn" onClick={onGeneratePlan}>
                  <LayoutList size={18} strokeWidth={1} aria-hidden />
                  Todo List
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <div className="digest-loading">Select a repo to generate your digest.</div>;
}
