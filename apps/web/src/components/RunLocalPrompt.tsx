"use client";

import { useContext, useEffect, useState } from "react";

import { RunLocalPhaseContext } from "@/components/RunLocalMotion";

/**
 * Typewriter for the `$ askscout` command at the top of the
 * Run It Locally terminal mock. Types char-by-char at 15ms
 * when the section enters viewport.
 *
 * SSR + no-JS + reduced-motion: initial state is the FULL
 * string so the static final paint never blanks out.
 */

const PROMPT = "$ askscout";
const PER_CHAR_MS = 45;

export function RunLocalPrompt() {
  const phase = useContext(RunLocalPhaseContext);
  const [displayed, setDisplayed] = useState(PROMPT);

  useEffect(() => {
    if (phase !== "playing") return;
    let cancelled = false;
    let i = 0;
    setDisplayed("");
    let timer: ReturnType<typeof setTimeout> | null = null;
    const tick = () => {
      if (cancelled) return;
      i += 1;
      setDisplayed(PROMPT.slice(0, i));
      if (i < PROMPT.length) {
        timer = setTimeout(tick, PER_CHAR_MS);
      }
    };
    timer = setTimeout(tick, PER_CHAR_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [phase]);

  return <p className="home-runlocal-stream-prompt">{displayed}</p>;
}
