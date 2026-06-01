"use client";

import { useContext, useEffect, useState } from "react";

import { GraphicPhaseContext } from "@/components/HeroGraphicMotion";

/**
 * Marketing-scoped equivalent of <DigestOpener />. Same editorial
 * voice — "Scanning the horizon for commits…" types itself out
 * char by char with a blinking caret — but sized for the digest
 * graphic's 12-14px scale instead of the dashboard's 16-18px.
 *
 * Reads the phase from <HeroGraphicMotion>'s context. When the
 * phase enters "opener", types from empty up to the full line.
 * The element's visibility (and the caret blink) are CSS-driven
 * off [data-graphic-phase] on the wrapper — this component only
 * owns the displayed substring state. SSR / no-JS users render
 * the full line in the markup but CSS hides it unless phase is
 * "opener", so they never see it (and don't see a flash).
 */

const OPENER_LINE = "Scanning the horizon for commits…";
const PER_CHAR_MS = 38;

export function HeroCardOpener() {
  const phase = useContext(GraphicPhaseContext);
  // Initial value is the FULL line — SSR + pre-hydration render
  // the complete sentence, and CSS hides it unless phase is
  // "opener". The effect below resets to empty + types up once
  // phase enters "opener".
  const [displayed, setDisplayed] = useState(OPENER_LINE);

  useEffect(() => {
    if (phase !== "opener") return;
    let cancelled = false;
    let i = 0;
    setDisplayed("");
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setDisplayed(OPENER_LINE.slice(0, i));
      if (i < OPENER_LINE.length) {
        timer = setTimeout(tick, PER_CHAR_MS);
      }
    };
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(tick, PER_CHAR_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [phase]);

  return (
    <div className="home-hero-card-opener" aria-hidden>
      <span className="home-hero-card-opener-text">{displayed}</span>
      <span className="home-hero-card-opener-caret" />
    </div>
  );
}
