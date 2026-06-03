"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Scroll-triggered reveal for the Trust section
 * ("Private. Secure. Open source.").
 *
 * Mirrors the architecture of FeaturesMotion so the marketing
 * page has one consistent motion language:
 *
 * - Initial phase is "done" so SSR / no-JS / pre-hydration paint
 *   shows the static final state — never a flash of invisible
 *   content or a frame of half-revealed cards.
 * - After hydration, IntersectionObserver waits for ~20% of the
 *   section to enter the viewport (threshold: 0.2).
 * - On first fire, phase drops to "idle" (sets the from-state)
 *   for one paint, then bumps to "playing" on the next paint so
 *   the CSS transitions actually run.
 * - Header fades + lifts first (0ms delay). Three cards stagger
 *   in after the header at 150 / 280 / 410ms, each with a 600ms
 *   ease-out-expo curve.
 * - After the timeline completes (~1100ms total), phase settles
 *   back to "done" so the transition rules disengage and any
 *   subsequent hover or interaction state changes are instant
 *   instead of riding the slow reveal curve.
 * - prefers-reduced-motion users stay in "done" forever and never
 *   see the animation.
 * - playedRef pins the run so the observer disconnect + React
 *   strict-mode double-effects can never re-trigger.
 *
 * The component renders the <section> element itself so the
 * MarketingHome call site stays one node deep — no wrapper div.
 */

type TrustPhase = "idle" | "playing" | "done";

interface Props {
  children: ReactNode;
}

export function TrustMotion({ children }: Props) {
  const [phase, setPhase] = useState<TrustPhase>("done");
  const rootRef = useRef<HTMLElement | null>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (playedRef.current) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
          // Drop to "idle" for a frame so the from-state (opacity 0,
          // translateY) is what the browser paints first. Then on
          // the next frame bump to "playing" so the transition runs.
          setPhase("idle");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setPhase("playing");
              // After the longest staggered transition completes,
              // settle back to "done" so future state changes (hover,
              // focus, etc.) don't ride the slow reveal curve.
              // Math: last card delay (410ms) + duration (600ms) +
              // a small buffer (90ms) = 1100ms.
              window.setTimeout(() => setPhase("done"), 1100);
            });
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
    <section ref={rootRef} className="home-section home-trust" data-trust-phase={phase}>
      {children}
    </section>
  );
}
