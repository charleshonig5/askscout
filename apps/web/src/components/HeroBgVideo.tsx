"use client";

import { useEffect, useRef } from "react";

/**
 * Silent looping background video for the marketing hero.
 *
 * Client component for two reasons:
 *   1. `playbackRate` can't be set declaratively on `<video>` in
 *      JSX — we slow the loop to 0.65x so the starfield drifts at
 *      an atmospheric pace, matching the Figma reference.
 *   2. Loop resilience. The `loop` attribute restarts the clip,
 *      but iOS still *pauses* autoplaying video on tab-switch,
 *      scroll-away, and Low Power Mode — and doesn't always resume.
 *      We listen for `pause` / tab-visible and nudge it back.
 */
interface Props {
  /** Override the video file. Defaults to /hero-starfield.mp4 — the
   *  production marketing hero. The /dev/hero-video-test route uses
   *  this prop to compare a candidate replacement without touching
   *  the live page. */
  src?: string;
}

export function HeroBgVideo({ src = "/hero-starfield.mp4" }: Props = {}) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.playbackRate = 0.65;

    // Whenever the video gets paused (by the OS, not a user — it
    // has no controls), or the tab becomes visible again, resume
    // it and re-assert playbackRate (iOS can reset it on resume).
    // play() may reject under a hard block like Low Power Mode —
    // swallow that; nothing more we can do there.
    const resume = () => {
      v.playbackRate = 0.65;
      if (v.paused) {
        void v.play().catch(() => {});
      }
    };
    const onVisibility = () => {
      if (!document.hidden) resume();
    };
    v.addEventListener("pause", resume);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      v.removeEventListener("pause", resume);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <video
      ref={ref}
      className="home-hero-bg"
      src={src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden
    />
  );
}
