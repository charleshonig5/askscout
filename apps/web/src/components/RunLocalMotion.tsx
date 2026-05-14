"use client";

import { createContext, useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered motion orchestrator for the Run It Locally
 * terminal mock. Fires once when the section enters the viewport.
 *
 * Phase machine:
 *   "done"    — initial state. SSR / no-JS / pre-hydration /
 *               reduced-motion users see the final static
 *               terminal with all content visible.
 *   "idle"    — sub-frame state that pre-sets the "from" of
 *               every CSS animation so the cascade starts
 *               from a clean blank terminal.
 *   "playing" — animations fire on their delay schedules.
 *
 * Plays exactly once per page load: a ref guards the observer
 * fire and survives strict-mode double-effects + observer
 * re-entry on scroll back.
 */

export type RunLocalPhase = "idle" | "playing" | "done";

export const RunLocalPhaseContext = createContext<RunLocalPhase>("done");

interface Props {
  children: React.ReactNode;
}

export function RunLocalMotion({ children }: Props) {
  const [phase, setPhase] = useState<RunLocalPhase>("done");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (playedRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      playedRef.current = true;
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !playedRef.current) {
          playedRef.current = true;
          setPhase("idle");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setPhase("playing"));
          });
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <RunLocalPhaseContext.Provider value={phase}>
      <div
        ref={rootRef}
        data-runlocal-phase={phase}
        className="home-runlocal-motion"
      >
        {children}
      </div>
    </RunLocalPhaseContext.Provider>
  );
}
