"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Premium opener for the digest pre-stream phase.
 *
 * Replaces the old PhaseTracker (rotating "Sniffing through your commits…"
 * messages above skeletons). Instead, a single editorial line types itself
 * out using *real stats from the user's repo*:
 *
 *     "Reading 12 commits across 3 files…"
 *
 * Why this is the right opener:
 *   1. It's specific to the user's data — not a generic spinner. The numbers
 *      come from the SSE `stats` event, which lands well before the first
 *      text chunk in nearly every run.
 *   2. The italic serif treatment + blinking cursor reads as editorial /
 *      narrated, matching Scout's voice.
 *   3. It guarantees a minimum visible duration of ~1.5–2s regardless of how
 *      fast the LLM responds, so the moment always registers without adding
 *      meaningful latency for the user.
 *
 * Lifecycle (controlled fully by this component):
 *   1. Mount → wait START_DELAY_MS (lets the card finish appearing first)
 *   2. Type the sentence one char at a time at PER_CHAR_MS
 *   3. After the last char, dwell DWELL_MS (so the eye can read it)
 *   4. Call onComplete — parent then begins fade-out and reveals skeletons
 *
 * The sentence is locked in at the moment typing STARTS, not at mount time.
 * That way, if `stats` arrives during the START_DELAY_MS window, we still
 * get the rich numeric line. If stats never arrives (unlikely), we fall
 * back to a generic line.
 */

interface DigestOpenerProps {
  /** Total commits in this digest. Pulled from the SSE stats event. */
  commits?: number;
  /** Total files changed in this digest. Pulled from the SSE stats event. */
  filesChanged?: number;
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

// Timing tuned for an editorial, unhurried moment. Total visible duration:
//   short line  ("Reading your repo…", 18 chars):        ~3.1s
//   full line   ("Reading N commits across N files…"):   ~4.0s
// The dwell in particular is generous on purpose — the line has to survive
// long enough to actually be read, not flash past. If it feels too slow in
// practice, dial DWELL_MS back first (typing pace reads as deliberate here,
// a faster cadence makes it look like a loading spinner).
const START_DELAY_MS = 450;
const PER_CHAR_MS = 40;
const DWELL_MS = 2000;

function buildSentence(commits?: number, filesChanged?: number): string {
  // Fallback: stats unavailable or zero. Generic but still in voice.
  if (!commits || commits <= 0) return "Reading your repo\u2026";

  const fmt = (n: number) => n.toLocaleString("en-US");
  const c = `${fmt(commits)} ${commits === 1 ? "commit" : "commits"}`;

  if (filesChanged && filesChanged > 0) {
    const f = `${fmt(filesChanged)} ${filesChanged === 1 ? "file" : "files"}`;
    return `Reading ${c} across ${f}\u2026`;
  }
  return `Reading ${c}\u2026`;
}

export function DigestOpener({
  commits,
  filesChanged,
  onComplete,
  fadingOut = false,
}: DigestOpenerProps) {
  const [displayed, setDisplayed] = useState("");

  // Refs so the typing loop reads the latest props/callback without
  // re-running its effect (which would restart typing mid-sentence).
  const propsRef = useRef({ commits, filesChanged });
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    propsRef.current = { commits, filesChanged };
  }, [commits, filesChanged]);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const startTyping = () => {
      if (cancelled) return;
      // Lock in the sentence NOW (after START_DELAY_MS) so any stats that
      // arrived during the wait are reflected. Once typing starts we don't
      // change the target string — switching mid-word would look broken.
      const { commits: c, filesChanged: f } = propsRef.current;
      const sentence = buildSentence(c, f);

      let i = 0;
      const tick = () => {
        if (cancelled) return;
        i += 1;
        setDisplayed(sentence.slice(0, i));

        if (i < sentence.length) {
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

  return (
    <div className={`digest-opener${fadingOut ? " is-fading" : ""}`} aria-live="polite">
      <span className="digest-opener-text">{displayed}</span>
      <span className="digest-opener-cursor" aria-hidden />
    </div>
  );
}
