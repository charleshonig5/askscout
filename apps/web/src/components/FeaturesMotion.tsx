"use client";

import { createContext, useEffect, useRef, useState } from "react";

/**
 * Scroll-triggered motion orchestrator for the 4-card features
 * section ("A Daily Read on your Code in Plain Language").
 *
 * Behavior summary
 * ----------------
 * - Plays ONCE per page load. After the first IntersectionObserver
 *   fire the observer disconnects and a ref pins the phase so any
 *   subsequent scroll-out / scroll-in is a no-op.
 * - All 4 cards fire together the moment the grid scrolls into
 *   view (≈20% threshold).
 * - prefers-reduced-motion users skip the timeline entirely and
 *   land on the static final state immediately.
 * - SSR / no-JS / pre-hydration paint shows the static final state
 *   because the initial phase is "done" — never a flash of empty
 *   bullets / pre-count zeros / un-typed paragraph.
 *
 * The wrapper renders the active phase into a data attribute that
 * CSS targets for the per-card animations. JS-driven children
 * (Card 4's typewriter) subscribe to the context.
 */

export type FeaturesPhase = "idle" | "playing" | "done";

export const FeaturesPhaseContext = createContext<FeaturesPhase>("done");

interface Props {
  children: React.ReactNode;
}

export function FeaturesMotion({ children }: Props) {
  // Initial state is "done" — first paint shows the static final
  // version (bullets visible, numbers at target, toggles ON,
  // paragraph fully typed). After hydration confirms we're in the
  // viewport, we reset to "playing" and run the timeline forward.
  const [phase, setPhase] = useState<FeaturesPhase>("done");
  const rootRef = useRef<HTMLDivElement | null>(null);
  // Once true, no further phase updates fire. Survives observer
  // re-entry on scroll-back and React strict-mode double-effects.
  const playedRef = useRef(false);

  useEffect(() => {
    if (playedRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      playedRef.current = true;
      // Stay in "done". No animation timeline.
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !playedRef.current) {
          playedRef.current = true;
          // Drop to "idle" for a frame so the CSS animations'
          // "from" keyframes are the starting state, then bump
          // to "playing" on the next paint so the transitions
          // actually run. requestAnimationFrame guarantees the
          // browser saw the "idle" state before "playing" kicks
          // the animations off.
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
    <FeaturesPhaseContext.Provider value={phase}>
      <div
        ref={rootRef}
        data-features-phase={phase}
        className="home-features-motion"
      >
        {children}
      </div>
    </FeaturesPhaseContext.Provider>
  );
}
