/**
 * Twinkly starfield for the marketing hero. Pure CSS animation, zero
 * JS at runtime. Sits behind the hero content via absolute positioning
 * + a low z-index. Pointer-events disabled so it can't intercept the
 * CTA clicks.
 *
 * Positions are generated at module load via a seeded PRNG so the
 * layout is identical between SSR and the client (no hydration
 * mismatch) and stable across reloads. Want a different layout? Bump
 * SEED.
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

interface Star {
  /** Horizontal position as a percentage of the container's width. */
  x: number;
  /** Vertical position as a percentage of the container's height. */
  y: number;
  /** Pixel size — 1, 2, or 3. Bigger stars are rarer. */
  size: 1 | 2 | 3;
  /** Animation start offset in seconds (0–6). Staggered so stars don't
   *  pulse in sync. */
  delay: number;
  /** Twinkle cycle duration in seconds (3–6). Varied so the field
   *  doesn't read as a metronome. */
  duration: number;
}

const SEED = 42;
const STAR_COUNT = 36;

const STARS: Star[] = (() => {
  const rand = mulberry32(SEED);
  const out: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    const sizeRoll = rand();
    const size: 1 | 2 | 3 = sizeRoll < 0.6 ? 1 : sizeRoll < 0.9 ? 2 : 3;
    out.push({
      x: rand() * 100,
      y: rand() * 100,
      size,
      delay: rand() * 6,
      duration: 3 + rand() * 3,
    });
  }
  return out;
})();

export function HeroStars() {
  return (
    <div className="hero-stars" aria-hidden>
      {STARS.map((star, i) => (
        <span
          key={i}
          className={`hero-star hero-star--${star.size}`}
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
