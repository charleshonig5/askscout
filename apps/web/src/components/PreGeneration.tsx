"use client";

import { Emoji } from "@/components/Emoji";

/**
 * Pre-generation UI pieces.
 *
 *   - SectionSkeleton: one skeleton section (emoji header + 4 shimmer
 *     lines) used in the narrative column. As each section marker
 *     arrives in the stream, its skeleton is replaced in place by the
 *     real typing content.
 *   - SidebarSkeleton: the umbrella stats-column skeleton — one
 *     "Statistics" header followed by three sub-blocks (lines /
 *     cards / lines) per the Figma. Renders during streaming and
 *     unmounts in one beat when stats arrive.
 *
 * The progressive-replacement pattern: during streaming, parsed
 * sections render as real content, and SECTION_MARKERS that haven't
 * arrived yet render as SectionSkeletons. As each new section marker
 * appears in the stream, its skeleton gets replaced by the real
 * typing section. Layout stays stable, transitions feel smooth — no
 * big collapse when typing begins.
 *
 * The pre-stream "voice" of Scout (single editorial typed line) lives
 * in DigestOpener.tsx and runs BEFORE skeletons appear.
 */

export interface SkeletonShape {
  key: string;
  emoji: string;
  label: string;
}

/**
 * Main column skeletons: the six LLM-streamed narrative sections.
 * Rendered in StreamingDigest for any section whose marker hasn't been
 * parsed out of the stream yet. Each one is replaced in place by the
 * real typing section when its marker arrives.
 */
export const SECTION_SKELETONS: SkeletonShape[] = [
  { key: "vibe", emoji: "\u{1F4AC}", label: "Vibe Check" },
  { key: "shipped", emoji: "\u{1F680}", label: "Shipped" },
  { key: "changed", emoji: "\u{1F527}", label: "Changed" },
  { key: "unstable", emoji: "\u{1F501}", label: "Still Shifting" },
  { key: "leftOff", emoji: "\u{1F4CD}", label: "Left Off" },
  { key: "takeaway", emoji: "\u{1F511}", label: "Key Takeaways" },
];

/**
 * Sub-section keys the sidebar can show post-streaming. Used by the
 * "should sidebar mount at all?" check — if a user has hidden every
 * sidebar section, the column gets dropped from the layout entirely.
 */
export const SIDEBAR_SECTION_KEYS = [
  "statistics",
  "mostActiveFiles",
  "whenYouCoded",
  "paceCheck",
  "codebaseHealth",
] as const;

// Per-section line widths (Figma node 138:1151). Keep four lines per
// section, varied widths so the skeleton reads as natural prose.
const NARRATIVE_LINE_WIDTHS = ["100%", "84%", "67%", "94%"];

export function SectionSkeleton({
  shape,
  animationDelay = 0,
}: {
  shape: SkeletonShape;
  animationDelay?: number;
}) {
  return (
    <div
      className="pregen-skeleton-section"
      style={{ animationDelay: `${animationDelay}ms` }}
      aria-hidden
    >
      <div className="pregen-skeleton-title">
        <Emoji name={shape.key} size={20} />
        <span className="pregen-skeleton-label">{shape.label}</span>
      </div>
      <div className="pregen-skeleton-lines">
        {NARRATIVE_LINE_WIDTHS.map((w, i) => (
          <div key={i} className="pregen-skeleton-line" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

// Sidebar skeleton uses three sub-blocks per Figma node 138:1151:
// quick-stats lines, three card placeholders, then more lines.
const SIDEBAR_LINE_WIDTHS_TOP = ["100%", "84%", "67%", "92%"];
const SIDEBAR_LINE_WIDTHS_BOTTOM = ["100%", "84%", "67%", "92%"];

export function SidebarSkeleton() {
  return (
    <div className="pregen-sidebar-skeleton" aria-hidden>
      <div className="pregen-skeleton-title">
        <Emoji name="statistics" size={20} />
        <span className="pregen-skeleton-label">Statistics</span>
      </div>
      <div className="pregen-sidebar-skeleton-body">
        <div className="pregen-skeleton-lines">
          {SIDEBAR_LINE_WIDTHS_TOP.map((w, i) => (
            <div key={i} className="pregen-skeleton-line" style={{ width: w }} />
          ))}
        </div>
        <div className="pregen-skeleton-cards">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="pregen-skeleton-card" />
          ))}
        </div>
        <div className="pregen-skeleton-lines">
          {SIDEBAR_LINE_WIDTHS_BOTTOM.map((w, i) => (
            <div key={i} className="pregen-skeleton-line" style={{ width: w }} />
          ))}
        </div>
      </div>
    </div>
  );
}
