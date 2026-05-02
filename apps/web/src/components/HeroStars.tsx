/**
 * Twinkly starfield for the marketing hero. Pure CSS animation, zero
 * JS at runtime. Sits behind the hero content via absolute positioning
 * + a low z-index. Pointer-events disabled so it can't intercept the
 * CTA clicks.
 *
 * Eight size tiers — four dot, four sparkle — for natural variation:
 *   - dot-1 (1px) and dot-2 (2px) dominate as the background dust.
 *   - dot-3 (3px) and dot-4 (4px with halo) add depth.
 *   - sparkle-6 / sparkle-8 are the small 4-point twinkle shapes.
 *   - sparkle-12 / sparkle-16 are the rare halo'd showpieces.
 *
 * Four cadence variants drive different twinkle behaviors so the
 * field doesn't pulse with one shared rhythm:
 *   - "breath"  standard 0.15→0.85 ease, mid duration.
 *   - "slow"    long, low-amplitude breath (asymmetric peak).
 *   - "pulse"   brief sharp flash up to full opacity.
 *   - "glow"    near-static gentle drift.
 * Each star gets one cadence + its own randomized duration + delay,
 * so two adjacent stars rarely match in shape, speed, or phase.
 *
 * Positions, kinds, cadences, sizes, and timings are generated at
 * module load via a seeded PRNG so SSR + client agree on layout
 * (no hydration mismatch) and the layout is stable across reloads.
 * Bump SEED to reshuffle.
 *
 * Honors prefers-reduced-motion via the .hero-star rule in
 * globals.css — users with that preference get static stars at a
 * baseline opacity, no twinkle.
 */

/** Tiny deterministic PRNG (Mulberry32). Returns values in [0, 1). */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type StarKind =
  | "dot-1"
  | "dot-2"
  | "dot-3"
  | "dot-4"
  | "sparkle-6"
  | "sparkle-8"
  | "sparkle-12"
  | "sparkle-16";

type Cadence = "breath" | "slow" | "pulse" | "glow";

interface Star {
  /** Horizontal position as a percentage of the container's width. */
  x: number;
  /** Vertical position as a percentage of the container's height. */
  y: number;
  /** Visual variant. Drives the size class and the DOM shape (round
   *  vs. 4-point sparkle SVG). */
  kind: StarKind;
  /** Twinkle behavior. Picks which keyframe drives the opacity
   *  curve. */
  cadence: Cadence;
  /** Animation start offset in seconds. Wide range (0–12s) so the
   *  field doesn't visually start in lockstep on initial mount. */
  delay: number;
  /** Cycle duration in seconds. Tuned per-cadence so the curve
   *  shape and the speed feel coherent (a "slow" cadence runs
   *  longer than a "pulse"). */
  duration: number;
}

const SEED = 42;
const STAR_COUNT = 100;

/** Cumulative-weighted draw for star kind. Dots dominate; bigger
 *  sparkles are rare. */
function pickKind(roll: number): StarKind {
  if (roll < 0.32) return "dot-1";
  if (roll < 0.56) return "dot-2";
  if (roll < 0.72) return "dot-3";
  if (roll < 0.82) return "dot-4";
  if (roll < 0.9) return "sparkle-6";
  if (roll < 0.96) return "sparkle-8";
  if (roll < 0.99) return "sparkle-12";
  return "sparkle-16";
}

/** Cumulative-weighted draw for cadence. "breath" is the most
 *  common base behavior; "slow" and "glow" add calm; "pulse" is
 *  rare so sharp flashes don't overwhelm. */
function pickCadence(roll: number): Cadence {
  if (roll < 0.45) return "breath";
  if (roll < 0.75) return "slow";
  if (roll < 0.93) return "glow";
  return "pulse";
}

/** Each cadence has its own duration window. Tuned so the visual
 *  speed matches the curve shape (slow breaths run long, sharp
 *  pulses run short). */
function durationFor(cadence: Cadence, rand: () => number): number {
  switch (cadence) {
    case "breath":
      return 3.5 + rand() * 3.5; // 3.5 – 7s
    case "slow":
      return 6 + rand() * 5; // 6 – 11s
    case "glow":
      return 7 + rand() * 6; // 7 – 13s
    case "pulse":
      return 2.5 + rand() * 2.5; // 2.5 – 5s
  }
}

const STARS: Star[] = (() => {
  const rand = mulberry32(SEED);
  const out: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const cadence = pickCadence(rand());
    out.push({
      x: rand() * 100,
      y: rand() * 100,
      kind: pickKind(rand()),
      cadence,
      delay: rand() * 12,
      duration: durationFor(cadence, rand),
    });
  }
  return out;
})();

/** 4-point sparkle path. Thin diamond arms with a slight inset waist
 *  so it reads as a classic "✦" rather than a plain plus. */
const SPARKLE_PATH = "M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z";

export function HeroStars() {
  return (
    <div className="hero-stars" aria-hidden>
      {STARS.map((star, i) => {
        const isSparkle = star.kind.startsWith("sparkle-");
        return (
          <span
            key={i}
            className={`hero-star hero-star--${star.kind} hero-star--cadence-${star.cadence}`}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          >
            {isSparkle && (
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d={SPARKLE_PATH} />
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
}
