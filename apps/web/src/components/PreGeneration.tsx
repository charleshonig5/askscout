"use client";

import { useEffect, useState } from "react";

/**
 * Pre-generation UI pieces. Exposed as two small components so the parent
 * can compose them with the real streaming digest:
 *
 *   - PhaseTracker: pulsing-dot + rotating Scout-voiced message. Shown ONLY
 *     while we're waiting for the first text chunk. Fades out when real
 *     content starts streaming.
 *
 *   - SectionSkeleton: one skeleton section (emoji header + shimmer lines/
 *     bullets). Used both by StreamingDigest (to hold space for sections
 *     that haven't streamed in yet) and during the initial pre-text phase
 *     (to show the full shape of the incoming digest).
 *
 * The progressive-replacement pattern: during streaming, parsed sections
 * render as real content, and SECTION_MARKERS that haven't arrived yet
 * render as skeletons. As each new section marker appears in the stream,
 * its skeleton gets replaced by the real typing content. Layout stays
 * stable, transitions feel smooth — no big collapse when typing begins.
 */

export interface SkeletonShape {
  key: string;
  emoji: string;
  label: string;
  lines?: number;
  bullets?: number;
}

/**
 * Order + shape of the skeletons. Reflects the rendered order of the digest:
 * five LLM-streamed narrative sections, then Key Takeaways (also LLM-streamed),
 * then Statistics (computed — the skeleton holds space until the cascade
 * renders after streaming ends). The "stats" key matches SECTION_MARKERS so
 * the visibleSections toggle for Statistics also hides this skeleton.
 */
export const SECTION_SKELETONS: SkeletonShape[] = [
  { key: "vibe", emoji: "\u{1F4AC}", label: "Vibe Check", lines: 3 },
  { key: "shipped", emoji: "\u{1F680}", label: "Shipped", bullets: 3 },
  { key: "changed", emoji: "\u{1F527}", label: "Changed", bullets: 2 },
  { key: "unstable", emoji: "\u{1F501}", label: "Still Shifting", bullets: 2 },
  { key: "leftOff", emoji: "\u{1F4CD}", label: "Left Off", bullets: 1 },
  { key: "takeaway", emoji: "\u{1F511}", label: "Key Takeaways", lines: 2 },
  { key: "stats", emoji: "\u{1F4CA}", label: "Statistics", lines: 2 },
];

const PHASE_MESSAGES = [
  "Sniffing through your commits",
  "Looking at what changed",
  "Following the diffs",
  "Measuring the churn",
  "Piecing it together",
  "Writing the vibe check",
  "Almost ready",
];

export function PhaseTracker() {
  const [msgIdx, setMsgIdx] = useState(0);

  // Cycle messages every 2.2s. Stop at the last one so slow generations
  // don't loop back to "Sniffing through your commits" awkwardly.
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => Math.min(i + 1, PHASE_MESSAGES.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pregen-status">
      <span className="pregen-status-dot" aria-hidden />
      <span className="pregen-status-text" key={msgIdx}>
        {PHASE_MESSAGES[msgIdx]}
        <span className="pregen-status-dots">
          <span />
          <span />
          <span />
        </span>
      </span>
    </div>
  );
}

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
        <span className="pregen-skeleton-emoji">{shape.emoji}</span>
        <span className="pregen-skeleton-label">{shape.label}</span>
      </div>
      {shape.lines ? (
        <div className="pregen-skeleton-lines">
          {Array.from({ length: shape.lines }).map((_, li) => (
            <div
              key={li}
              className="pregen-skeleton-line"
              style={{ width: li === (shape.lines ?? 0) - 1 ? "60%" : "100%" }}
            />
          ))}
        </div>
      ) : (
        <div className="pregen-skeleton-bullets">
          {Array.from({ length: shape.bullets ?? 0 }).map((_, bi) => (
            <div key={bi} className="pregen-skeleton-bullet">
              <span className="pregen-skeleton-bullet-dot" />
              <span
                className="pregen-skeleton-line"
                style={{ width: `${75 - bi * 10}%` }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
