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
 * Mix is weighted so smaller and rounder dominate; the bigger sparkles
 * are eye-catchers, not the baseline.
 *
 * Positions, kinds, sizes, and timings are generated at module load
 * via a seeded PRNG so SSR + client agree on layout (no hydration
 * mismatch) and the layout is stable across reloads. Bump SEED to
 * reshuffle.
 *
 * Honors prefers-reduced-motion via the .hero-star keyframe rule in
 * globals.css — users with that preference get static stars at full
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

interface Star {
  /** Horizontal position as a percentage of the container's width. */
  x: number;
  /** Vertical position as a percentage of the container's height. */
  y: number;
  /** Visual variant. Drives the size class and the DOM shape (round
   *  vs. 4-point sparkle SVG). */
  kind: StarKind;
  /** Animation start offset in seconds (0–6). Staggered so stars don't
   *  pulse in sync. */
  delay: number;
  /** Twinkle cycle duration in seconds (3–6). Varied so the field
   *  doesn't read as a metronome. */
  duration: number;
}

const SEED = 42;
const STAR_COUNT = 100;

/** Cumulative-weighted draw for star kind. Tuned so the smaller and
 *  more numerous shapes dominate; bigger sparkles stay rare. */
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

const STARS: Star[] = (() => {
  const rand = mulberry32(SEED);
  const out: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    out.push({
      x: rand() * 100,
      y: rand() * 100,
      kind: pickKind(rand()),
      delay: rand() * 6,
      duration: 3 + rand() * 3,
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
            className={`hero-star hero-star--${star.kind}`}
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
