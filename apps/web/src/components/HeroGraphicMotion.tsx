"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animation orchestrator for the marketing hero's digest graphic.
 *
 * The graphic illustrates the live product's streaming behavior:
 * skeleton → LiveBadge moves section to section → bullets fade in
 * → stats count up → Codebase Health bars slide out. This is a
 * scripted reenactment, not a real stream — and it is intentionally
 * scoped to the marketing graphic only. None of the live dashboard
 * components, hooks, or CSS classes are reused. We share visual
 * primitives (shimmer keyframes, pulse keyframes) via marketing-
 * specific class names that alias the existing tokens.
 *
 * Phase machine (advances on a timeline once the graphic enters
 * the viewport):
 *   "skeleton" → "shipped" → "changed" → "stillShifting" → "leftOff"
 *   → "stats" → "done"
 *
 * Safety rails:
 * - Default state in CSS is "done" (everything visible). SSR + no-JS
 *   readers + pre-hydration paint see the static final graphic.
 * - prefers-reduced-motion users skip the timeline and land on "done".
 * - Plays once per page load. Subsequent re-renders are no-ops.
 * - IntersectionObserver guards the start so off-screen graphics
 *   don't fire prematurely on slow loads or background tabs.
 */

export type GraphicPhase =
  | "skeleton"
  | "shipped"
  | "changed"
  | "stillShifting"
  | "leftOff"
  | "stats"
  | "done";

interface Props {
  children: React.ReactNode;
}

export function HeroGraphicMotion({ children }: Props) {
  // Start in "done" so the very first paint (pre-hydration / SSR) is
  // the final static state — no flash of skeleton for users whose JS
  // is slow or disabled. The effect below resets to "skeleton" and
  // plays the timeline forward only after hydration confirms the
  // graphic is in the viewport.
  const [phase, setPhase] = useState<GraphicPhase>("done");
  const ref = useRef<HTMLDivElement | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (hasPlayedRef.current) return;

    // Reduced-motion users: stay on "done" forever. No reset to
    // skeleton, no timeline. They get the static graphic.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) {
      hasPlayedRef.current = true;
      return;
    }

    const el = ref.current;
    if (!el) return;

    const startTimeline = () => {
      if (hasPlayedRef.current) return;
      hasPlayedRef.current = true;
      // Phase 0 — skeleton state visible. The setTimeout chain
      // below advances through the choreography. Timing is tight
      // and snappy per spec: ~3.5-4.5s total run.
      setPhase("skeleton");
      const t: NodeJS.Timeout[] = [];
      t.push(setTimeout(() => setPhase("shipped"), 500));
      t.push(setTimeout(() => setPhase("changed"), 1100));
      t.push(setTimeout(() => setPhase("stillShifting"), 1700));
      t.push(setTimeout(() => setPhase("leftOff"), 2300));
      t.push(setTimeout(() => setPhase("stats"), 2900));
      t.push(setTimeout(() => setPhase("done"), 3800));
      // Cleanup if the component unmounts mid-timeline.
      return () => t.forEach((id) => clearTimeout(id));
    };

    // Only start the timeline once the graphic actually intersects
    // the viewport. For the hero this is essentially instant, but
    // the guard covers background tabs, slow loads, and any future
    // case where the graphic isn't above the fold.
    let cleanup: (() => void) | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          cleanup = startTimeline();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      cleanup?.();
    };
  }, []);

  return (
    <div ref={ref} data-graphic-phase={phase} className="home-hero-graphic-motion">
      {children}
    </div>
  );
}
