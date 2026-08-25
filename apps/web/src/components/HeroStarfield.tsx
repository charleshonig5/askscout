"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Star ring + glow backdrop for the marketing hero graphic.
 *
 * Replaces the 7 MB looping starfield video that used to sit
 * behind the whole hero. Same atmospheric intent, built from ~80
 * 1px divs and one 1s interval instead of a video decode.
 *
 * Layout note — the stars deliberately never overlap the digest
 * graphic. `.home-hero-stars` is inset NEGATIVELY so it bleeds
 * outside the frame, and the four bands only occupy the gutter
 * ring around it (45px above/below, 86px each side). All of the
 * "space" lives in the margin; the product surface stays clean.
 *
 * Twinkle behaviour, in order of what makes it read as organic:
 *   1. Position + base opacity are randomised ONCE and never
 *      animate, so the field keeps a permanent sense of depth.
 *   2. Only ~20% of stars are ever eligible to twinkle. The rest
 *      are static. A field where everything blinks reads as noise.
 *   3. The scale pop fires only on a BRIGHTENING transition, and
 *      only 80% of those. Dimming happens silently on the opacity
 *      transition.
 *   4. Each pop gets a random 100-500ms delay so events don't land
 *      on the interval's beat.
 */

/** Deterministic PRNG (mulberry32).
 *
 *  Raycast generates star positions with bare `Math.random()` in a
 *  `useMemo`. We can't: this is a client component, so Next still
 *  renders it on the server first, and the server's random values
 *  wouldn't match the client's — every star's inline `top`/`left`/
 *  `opacity` would hydration-mismatch. A seeded generator produces
 *  the same field on both sides, which also means the starfield is
 *  identical on every load rather than reshuffling per visit. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fraction of a band's stars that are allowed to twinkle. */
const TWINKLE_SHARE = 0.2;
/** How often the twinkle state re-rolls, in ms. */
const TICK_MS = 1000;
/** How long the scale pop is held before it springs back. Must
 *  stay in step with the 250ms `transition` on .home-hero-star in
 *  globals.css — if they drift, the pop either snaps or lingers. */
const TRANSITION_MS = 250;

interface BandProps {
  /** How many stars this band holds. */
  count: number;
  /** Band position class (`home-hero-stars-top` etc). */
  className: string;
  /** PRNG seed. Distinct per band so the four rings don't share
   *  an identical layout. */
  seed: number;
}

function StarBand({ count, className, seed }: BandProps) {
  const stars = useMemo(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: count }).map(() => ({
      top: `${(rand() * 100).toFixed(2)}%`,
      left: `${(rand() * 100).toFixed(2)}%`,
      // 0.10 - 0.40. Never animated; this is the star's fixed
      // "distance" in the field.
      opacity: 0.1 + rand() * 0.3,
    }));
  }, [count, seed]);

  // The fixed subset of indices allowed to twinkle. Duplicates are
  // fine and intentional — a repeated index just means that star
  // gets more than one roll per tick.
  const twinklers = useMemo(() => {
    const rand = mulberry32(seed + 1);
    return Array.from({ length: Math.round(count * TWINKLE_SHARE) }).map(() =>
      Math.floor(rand() * count),
    );
  }, [count, seed]);

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Respect reduced-motion: leave every star at its base opacity
    // and never start the interval. The old bg video ignored this
    // entirely.
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (motionQuery.matches) return;

    const states = ["off", "medium", "high"] as const;
    const pending: ReturnType<typeof setTimeout>[] = [];

    const tick = () => {
      const root = ref.current;
      if (!root) return;
      for (const index of twinklers) {
        const el = root.querySelector<HTMLElement>(`[data-index="${index}"]`);
        if (!el) continue;

        const next = states[Math.floor(Math.random() * states.length)];
        const prev = el.dataset.state;

        // Pop only when the star is getting brighter, and only 80%
        // of the time. Dimming is silent.
        const brightening =
          (prev === "off" && next === "high") ||
          (prev === "off" && next === "medium") ||
          (prev === "medium" && next === "high");
        const pop = Math.random() > 0.2 && brightening;

        if (pop) {
          const delay = Math.floor(Math.random() * 401) + 100;
          pending.push(setTimeout(() => (el.style.transform = "scale(2)"), delay));
          pending.push(setTimeout(() => (el.style.transform = "scale(1)"), delay + TRANSITION_MS));
        }

        // A high→medium step reads as a stutter rather than a fade,
        // so send it all the way off instead.
        el.dataset.state = prev === "high" && next === "medium" && pop ? "off" : next;
      }
    };

    const id = setInterval(tick, TICK_MS);
    return () => {
      clearInterval(id);
      for (const t of pending) clearTimeout(t);
    };
  }, [twinklers]);

  return (
    <div ref={ref} className={className}>
      {stars.map((star, i) => (
        <div
          key={i}
          className="home-hero-star"
          data-state="off"
          data-index={i}
          style={{ top: star.top, left: star.left, opacity: star.opacity }}
        />
      ))}
    </div>
  );
}

/**
 * Wraps the hero graphic with the glow backdrop and the four star
 * bands. Children render on top, inside the ring.
 */
export function HeroStarfield({ children }: { children: React.ReactNode }) {
  return (
    <div className="home-hero-backdrop-wrapper">
      <div className="home-hero-backdrop" aria-hidden />
      <div className="home-hero-stars" aria-hidden>
        {/* Counts started from Raycast's 33/18/22/18 for a 1204px
            frame, scaled to Scout's 976px one (28/16/20/16 = 80),
            then taken up 20% to 96. The top band carries the most
            because it's the edge the eye reads first.

            Density, not just count: the bands are fixed-size, so
            +20% here is +20% stars per unit of gutter. The twinkle
            subset is a share of each band's count, so it scales
            with them and the field stays proportionally as calm. */}
        <StarBand count={34} className="home-hero-stars-top" seed={0x5c0} />
        <StarBand count={19} className="home-hero-stars-right" seed={0x5c1} />
        <StarBand count={24} className="home-hero-stars-bottom" seed={0x5c2} />
        <StarBand count={19} className="home-hero-stars-left" seed={0x5c3} />
      </div>
      {children}
    </div>
  );
}
