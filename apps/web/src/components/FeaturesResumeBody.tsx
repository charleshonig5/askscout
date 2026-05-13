"use client";

import { useContext, useEffect, useState } from "react";

import { FeaturesPhaseContext } from "@/components/FeaturesMotion";

/**
 * Client-side typewriter for the Current Focus paragraph in the
 * Resume Prompt card (Card 4). Reads the phase from
 * <FeaturesMotion> and types the body char-by-char when the phase
 * enters "playing".
 *
 * Char rate: 15ms — fast enough to feel like content streaming in,
 * slow enough to read as a typewriter and not a flicker.
 *
 * SSR + no-JS + reduced-motion: initial state is the FULL text so
 * the static final version paints immediately and never leaves a
 * blank paragraph behind. The effect only resets to empty and
 * types up once we know we're playing.
 */

const BODY =
  "Next work should focus on stability of streaming behavior under network timing like client aborts mid response, ensuring consistent visibility of parsed bullets only from true bullet prefixed lines. Remaining risk area includes correct DST safe calendar stepping when timelines span multiple days near midnight boundaries.";

const PER_CHAR_MS = 5;

export function FeaturesResumeBody() {
  const phase = useContext(FeaturesPhaseContext);
  const [displayed, setDisplayed] = useState(BODY);

  useEffect(() => {
    if (phase !== "playing") return;
    let cancelled = false;
    let i = 0;
    setDisplayed("");
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setDisplayed(BODY.slice(0, i));
      if (i < BODY.length) {
        timer = setTimeout(tick, PER_CHAR_MS);
      }
    };
    timer = setTimeout(tick, PER_CHAR_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [phase]);

  return <p className="home-features-resume-text">{displayed}</p>;
}
