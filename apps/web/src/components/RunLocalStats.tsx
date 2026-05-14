"use client";

import { useContext, useEffect, useState } from "react";

import { RunLocalPhaseContext } from "@/components/RunLocalMotion";

/**
 * Typewriter for the stats line directly under `$ askscout`
 * in the Run It Locally terminal. Starts 250ms after phase
 * enters playing (gives the prompt 150ms to type + 100ms
 * breather), then types at 10ms/char so the ~35-char line
 * lands in ~350ms.
 *
 * SSR-safe initial state: full string visible.
 */

const STATS = "+425 · -86 · 19 commits · 8 files";
const START_DELAY_MS = 250;
const PER_CHAR_MS = 10;

export function RunLocalStats() {
  const phase = useContext(RunLocalPhaseContext);
  const [displayed, setDisplayed] = useState(STATS);

  useEffect(() => {
    if (phase !== "playing") return;
    let cancelled = false;
    let i = 0;
    setDisplayed("");
    const timers: ReturnType<typeof setTimeout>[] = [];
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setDisplayed(STATS.slice(0, i));
      if (i < STATS.length) {
        timers.push(setTimeout(tick, PER_CHAR_MS));
      }
    };
    timers.push(setTimeout(tick, START_DELAY_MS));
    return () => {
      cancelled = true;
      timers.forEach((id) => clearTimeout(id));
    };
  }, [phase]);

  return <p className="home-runlocal-stream-stats">{displayed}</p>;
}
