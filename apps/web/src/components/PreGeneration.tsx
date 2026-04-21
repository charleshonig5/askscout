"use client";

import { useEffect, useState } from "react";

/**
 * Pre-generation view shown between "user triggered a digest" and "first
 * streamed text arrived". Replaces the old single-line "Scout is sniffing..."
 * message with something that feels alive.
 *
 * Two layers:
 *   1. A phase tracker at the top that cycles Scout-voiced messages so the
 *      user never stares at a frozen screen. These are written from Scout's
 *      point of view — they describe what's broadly happening without
 *      claiming a precise step boundary.
 *   2. Skeleton section outlines below, matching the shape of the final
 *      digest. Creates anticipation — the page visibly prepares for content.
 *
 * Both disappear instantly the moment the first streamed text arrives;
 * the typing effect in StreamingDigest takes over with no conflict.
 */

// Section skeletons rendered during pre-generation. The order mirrors what
// the LLM streams back so the transition feels continuous when text starts.
const SKELETONS = [
  { emoji: "\u{1F4AC}", label: "Vibe Check", lines: 3 },
  { emoji: "\u{1F680}", label: "Shipped", bullets: 3 },
  { emoji: "\u{1F527}", label: "Changed", bullets: 2 },
  { emoji: "\u{1F501}", label: "Still Shifting", bullets: 2 },
  { emoji: "\u{1F4CD}", label: "Left Off", bullets: 1 },
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

export function PreGeneration() {
  const [msgIdx, setMsgIdx] = useState(0);

  // Rotate through Scout-voiced messages every 2.2s so the screen feels alive.
  // Loop stops at the final message so it doesn't cycle back to the start
  // on a particularly slow generation.
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((i) => Math.min(i + 1, PHASE_MESSAGES.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pregen">
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

      <div className="pregen-skeletons" aria-hidden>
        {SKELETONS.map((s, i) => (
          <div
            key={s.label}
            className="pregen-skeleton-section"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="pregen-skeleton-title">
              <span className="pregen-skeleton-emoji">{s.emoji}</span>
              <span className="pregen-skeleton-label">{s.label}</span>
            </div>
            {s.lines ? (
              <div className="pregen-skeleton-lines">
                {Array.from({ length: s.lines }).map((_, li) => (
                  <div
                    key={li}
                    className="pregen-skeleton-line"
                    style={{ width: li === s.lines - 1 ? "60%" : "100%" }}
                  />
                ))}
              </div>
            ) : (
              <div className="pregen-skeleton-bullets">
                {Array.from({ length: s.bullets ?? 0 }).map((_, bi) => (
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
        ))}
      </div>
    </div>
  );
}
