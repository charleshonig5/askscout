/**
 * Turn the raw streaming-digest text (the same string DigestView renders
 * client-side) into the structured props that DigestEmail expects.
 *
 * The digest is stored in Supabase as a single Markdown-ish blob whose
 * sections are delimited by leading emoji headers (💬 Vibe Check, 🚀
 * Shipped, …). The client renders this with parseStreamingSections +
 * splitBulletTitle inside DigestView. To keep the email and the on-screen
 * digest in lockstep we duplicate that parsing logic server-side here
 * rather than rendering DigestView itself — the on-screen component is a
 * client component that depends on hooks, refs, and animation helpers
 * that don't survive React Email's render() call.
 *
 * If the parsing logic in DigestView ever changes (new section, different
 * marker, different bullet shape), update both places. There is a
 * matching unit-test target in __tests__/digest-text-to-props.test.ts
 * (TODO) — until then this file is the canonical server-side reference.
 */

import type { DigestEmailProps } from "@/emails/DigestEmail";

interface BulletItem {
  title: string;
  context: string;
}

// Mirror the section markers used by DigestView. Kept in array form so
// section boundaries can be inferred by walking forward to the next
// known marker (the LLM never emits these emojis except as headers).
const SECTION_MARKERS = [
  { key: "vibe", emoji: "\u{1F4AC}", label: "Vibe Check" },
  { key: "shipped", emoji: "\u{1F680}", label: "Shipped" },
  { key: "changed", emoji: "\u{1F527}", label: "Changed" },
  { key: "unstable", emoji: "\u{1F501}", label: "Still Shifting" },
  { key: "leftOff", emoji: "\u{1F4CD}", label: "Left Off" },
  { key: "fieldNotes", emoji: "\u{1F9ED}", label: "Field Notes" },
  { key: "takeaway", emoji: "\u{1F511}", label: "Key Takeaways" },
  { key: "stats", emoji: "\u{1F4CA}", label: "Stats" },
] as const;

type SectionKey = (typeof SECTION_MARKERS)[number]["key"];

function parseSections(text: string): Map<SectionKey, string> {
  const out = new Map<SectionKey, string>();
  for (let i = 0; i < SECTION_MARKERS.length; i++) {
    const marker = SECTION_MARKERS[i]!;
    const needle = `${marker.emoji} ${marker.label}`;
    const startIdx = text.indexOf(needle);
    if (startIdx === -1) continue;
    const contentStart = startIdx + needle.length;
    let endIdx = text.length;
    for (let j = i + 1; j < SECTION_MARKERS.length; j++) {
      const nextNeedle = `${SECTION_MARKERS[j]!.emoji} ${SECTION_MARKERS[j]!.label}`;
      const nextIdx = text.indexOf(nextNeedle, contentStart);
      if (nextIdx !== -1) {
        endIdx = nextIdx;
        break;
      }
    }
    out.set(marker.key, text.slice(contentStart, endIdx).trim());
  }
  return out;
}

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Mirror of DigestView's splitBulletTitle. Kept verbatim so the email
 *  bullet shape matches what the user sees on screen. */
function splitBulletTitle(item: string): { title: string; context: string } {
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
    const title = words.slice(0, 4).join(" ").replace(/[,;:.!?]+$/, "");
    const context = capitalizeFirst(words.slice(4).join(" "));
    return { title, context };
  }
  return { title: item.trim(), context: "" };
}

/** Turn a bulleted-section body into a list of {title, context} items.
 *  The LLM separates bullets with leading "- " or "• "; we tolerate both
 *  and treat blank lines as soft separators too. Any line that begins
 *  with a SECTION emoji is dropped defensively — those are re-emitted
 *  section headers the model occasionally inlines. */
function parseBullets(body: string): BulletItem[] {
  const sectionEmojiPrefix =
    /^[\u{1F4AC}\u{1F680}\u{1F527}\u{1F501}\u{1F4CD}\u{1F9ED}\u{1F511}\u{1F4CA}]/u;
  return body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !sectionEmojiPrefix.test(line))
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean)
    .map(splitBulletTitle);
}

/** Field Notes body has a one-line subtitle on top then prose. We split
 *  on the first blank line; if there isn't one, the first sentence
 *  becomes the subtitle. */
function parseFieldNotes(body: string): { subtitle: string; body: string } | undefined {
  if (!body.trim()) return undefined;
  const blankSplit = body.split(/\n\s*\n/);
  if (blankSplit.length >= 2) {
    return {
      subtitle: blankSplit[0]!.trim(),
      body: blankSplit.slice(1).join("\n\n").trim(),
    };
  }
  const sentenceMatch = body.match(/^([^.!?]{4,80})[.!?]\s+(.+)$/s);
  if (sentenceMatch) {
    return { subtitle: sentenceMatch[1]!.trim(), body: sentenceMatch[2]!.trim() };
  }
  return { subtitle: body.trim(), body: "" };
}

export interface DigestTextToPropsInput {
  /** Full streaming-digest text as stored in Supabase `digests.content`. */
  text: string;
  /** Repo slug, e.g. "askscout". */
  repoName: string;
  /** Stats object stored alongside the digest. Shape is loose because
   *  upstream callers pass arbitrary JSON; we only pluck the four numbers
   *  the email template knows about. */
  stats?: Record<string, unknown> | null;
  /** Optional per-section visibility map from user_settings — undefined
   *  means show everything. */
  visibility?: Record<string, boolean>;
  /** Optional streak count, rendered as the fire-emoji chip. */
  streak?: number;
  /** Pre-formatted date label, e.g. "Thursday, May 8, 2026". When
   *  omitted, today's date in the server's locale is used. */
  dateLabel?: string;
  /** Header line, defaults to "Today's Digest". */
  digestTitle?: string;
}

function formatToday(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function pickNumber(stats: Record<string, unknown> | null | undefined, key: string): number | undefined {
  if (!stats) return undefined;
  const v = stats[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

export function digestTextToEmailProps(input: DigestTextToPropsInput): DigestEmailProps {
  const sections = parseSections(input.text);
  const fieldNotes = parseFieldNotes(sections.get("fieldNotes") ?? "");

  const stats = {
    commits: pickNumber(input.stats, "commits"),
    filesChanged: pickNumber(input.stats, "filesChanged"),
    linesAdded: pickNumber(input.stats, "linesAdded"),
    linesRemoved: pickNumber(input.stats, "linesRemoved"),
  };

  return {
    digestTitle: input.digestTitle ?? "Today's Digest",
    repoName: input.repoName,
    streak: input.streak,
    dateLabel: input.dateLabel ?? formatToday(),
    vibeCheck: sections.get("vibe") || undefined,
    shipped: parseBullets(sections.get("shipped") ?? ""),
    changed: parseBullets(sections.get("changed") ?? ""),
    unstable: parseBullets(sections.get("unstable") ?? ""),
    leftOff: parseBullets(sections.get("leftOff") ?? ""),
    fieldNotes,
    keyTakeaways: sections.get("takeaway") || undefined,
    stats:
      stats.commits != null ||
      stats.filesChanged != null ||
      stats.linesAdded != null ||
      stats.linesRemoved != null
        ? stats
        : null,
    visibility: input.visibility,
  };
}
