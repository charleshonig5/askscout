"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Premium opener for the digest pre-stream phase.
 *
 * A single editorial line types itself out, italic serif, blinking caret.
 * Scout voice, telescope mascot:
 *
 *     "Scanning the horizon for commits…"
 *
 * Why this is the right opener:
 *   1. Mascot-coherent — a telescope *scans*, and "horizon" reads as Scout
 *      surveying from a ridge. Matches the brand metaphor exactly.
 *   2. The italic serif treatment + blinking cursor reads as editorial,
 *      not a spinner. Feels narrated.
 *   3. The fixed sentence keeps this component tiny and predictable — no
 *      props to wait on, no ref juggling, no fallback branches.
 *
 * Lifecycle (fully self-contained):
 *   1. Mount → wait START_DELAY_MS (lets the card finish appearing first)
 *   2. Type the sentence one char at a time at PER_CHAR_MS
 *   3. After the last char, dwell DWELL_MS (so the eye can read it)
 *   4. Call onComplete — parent then begins fade-out and reveals skeletons
 */

interface DigestOpenerProps {
  /**
   * Called once typing + dwell are complete. Parent should use this to
   * start the fade-out transition and reveal the skeletons.
   */
  onComplete: () => void;
  /**
   * When true, the line fades to opacity 0. Parent flips this when it's
   * time to cross-fade into the skeletons. Set during the parent's
   * "fading" phase between the opener finishing and the skeletons mounting.
   */
  fadingOut?: boolean;
}

// Fixed editorial line — single source of voice for the opener moment.
const OPENER_LINE = "Scanning the horizon for commits\u2026";

// Timing tuned for an editorial, unhurried moment. Total visible duration
// is START_DELAY_MS + (OPENER_LINE.length * PER_CHAR_MS) + DWELL_MS ≈ 3.8s
// for the current line length. The dwell is generous on purpose — the line
// has to survive long enough to actually be read, not flash past. If it
// feels off, dial DWELL_MS back first (typing pace reads as deliberate; a
// faster cadence would make it look like a loading spinner).
const START_DELAY_MS = 450;
const PER_CHAR_MS = 40;
const DWELL_MS = 2000;

export function DigestOpener({ onComplete, fadingOut = false }: DigestOpenerProps) {
  const [displayed, setDisplayed] = useState("");

  // Focus-pull effect. Mount in a blurred + faded state (lens hasn't
  // resolved yet), then flip `focused = true` on the next frame so CSS
  // transitions the blur away. Without the requestAnimationFrame hop,
  // React would commit both states in a single paint and the browser
  // would skip the transition entirely.
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setFocused(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  // Ref so the typing loop reads the latest callback without re-running its
  // effect (which would restart typing mid-sentence).
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const startTyping = () => {
      if (cancelled) return;

      let i = 0;
      const tick = () => {
        if (cancelled) return;
        i += 1;
        setDisplayed(OPENER_LINE.slice(0, i));

        if (i < OPENER_LINE.length) {
          timer = setTimeout(tick, PER_CHAR_MS);
        } else {
          // Done typing — dwell, then signal parent.
          timer = setTimeout(() => {
            if (!cancelled) onCompleteRef.current();
          }, DWELL_MS);
        }
      };
      tick();
    };

    timer = setTimeout(startTyping, START_DELAY_MS);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const classes = ["digest-opener"];
  if (focused) classes.push("is-focused");
  if (fadingOut) classes.push("is-fading");

  return (
    <div className={classes.join(" ")} aria-live="polite">
      <span className="digest-opener-text">{displayed}</span>
      <span className="digest-opener-cursor" aria-hidden />
    </div>
  );
}
