"use client";

import { useEffect, useRef } from "react";

/**
 * Silent looping background video for the marketing hero.
 *
 * Pulled out as a client component for one reason: `playbackRate`
 * can't be set declaratively on `<video>` in JSX. We need a ref +
 * effect to slow the loop down so the starfield drifts at 0.8x —
 * matches the atmospheric pace in the Figma reference rather than
 * the raw 30fps timelapse motion of the source asset.
 */
export function HeroBgVideo() {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (v) v.playbackRate = 0.65;
  }, []);

  return (
    <video
      ref={ref}
      className="home-hero-bg"
      src="/hero-starfield.mp4"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden
    />
  );
}
