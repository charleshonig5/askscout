"use client";

import { createContext, useEffect, useRef, useState } from "react";

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
  | "opener"
  | "skeleton"
  | "shipped"
  | "changed"
  | "stillShifting"
  | "leftOff"
  | "stats"
  | "done";

/**
 * Context for descendants (e.g. <HeroCardOpener />) that need to
 * react to the current phase. The wrapper renders phase into a
 * data attribute for CSS, AND into this context for JS-driven
 * children that need to know when to start their own internal
 * animations (typed-out lines, etc.).
 */
export const GraphicPhaseContext = createContext<GraphicPhase>("done");

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

  useEffect(() => {
    // Reduced-motion users: stay on "done" forever. No reset to
    // skeleton, no timeline. They get the static graphic.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const el = ref.current;
    if (!el) return;

    let timers: ReturnType<typeof setTimeout>[] = [];

    const startTimeline = () => {
      // Phase 0 — "opener": "Scanning the horizon for commits…"
      // types itself out (HeroCardOpener subscribes to context
      // and runs the type-out itself). Then "skeleton" reveals
      // the placeholder shimmer rows, and the LiveBadge marches
      // through the left column → lands on Statistics → done.
      // Total run ~6.3s, paced to feel deliberate rather than
      // hurried — the opener moment matters for brand voice.
      //
      // Strict mode runs this effect twice in dev — that's fine:
      // the second run cancels and re-schedules with the same
      // setPhase calls. Idempotent.
      setPhase("opener");
      timers = [
        setTimeout(() => setPhase("skeleton"), 2400),
        setTimeout(() => setPhase("shipped"), 2900),
        setTimeout(() => setPhase("changed"), 3500),
        setTimeout(() => setPhase("stillShifting"), 4100),
        setTimeout(() => setPhase("leftOff"), 4700),
        setTimeout(() => setPhase("stats"), 5300),
        setTimeout(() => setPhase("done"), 6300),
      ];
    };

    // Only start the timeline once the graphic actually intersects
    // the viewport. For the hero this is essentially instant, but
    // the guard covers background tabs, slow loads, and any future
    // case where the graphic isn't above the fold.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          startTimeline();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      timers.forEach((id) => clearTimeout(id));
    };
  }, []);

  // Mobile: the digest graphic is a fixed 976px-wide element that
  // the mobile CSS shrinks with transform:scale to fit the content
  // column. CSS can't compute a unitless scale factor, so derive
  // it here — --hg-scale = (this wrapper's content width) / 976.
  //
  // Measuring the wrapper directly (rather than deriving from
  // window.innerWidth) is deliberate: innerWidth includes the
  // scrollbar, so on classic-scrollbar systems it would over-size
  // the graphic and skew the gutters. clientWidth is the real
  // space the graphic must fill. A ResizeObserver re-runs it on
  // every width change (viewport resize, device rotation).
  //
  // The mobile CSS consumes the var for transform:scale and the
  // wrapper height. Desktop CSS sets no transform, so it's inert
  // there — desktop is untouched.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const GRAPHIC_WIDTH = 976;
    const setScale = () => {
      el.style.setProperty(
        "--hg-scale",
        String(el.clientWidth / GRAPHIC_WIDTH),
      );
    };
    setScale();
    const observer = new ResizeObserver(setScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <GraphicPhaseContext.Provider value={phase}>
      <div
        ref={ref}
        data-graphic-phase={phase}
        className="home-hero-graphic-motion"
      >
        {children}
      </div>
    </GraphicPhaseContext.Provider>
  );
}
