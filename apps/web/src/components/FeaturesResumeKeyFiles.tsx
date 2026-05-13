"use client";

import { useContext, useEffect, useState } from "react";

import { FeaturesPhaseContext } from "@/components/FeaturesMotion";

/**
 * Client-side typewriter for the Key Files list in the Resume
 * Prompt card (Card 4). Reads the phase from <FeaturesMotion>
 * and types each file path char-by-char after the Current Focus
 * body has finished typing.
 *
 * Sequence (after phase enters "playing"):
 *   t=1700ms — start typing path 1 (gives the Current Focus
 *              body 322×5ms ≈ 1610ms to finish, plus a 90ms
 *              breather)
 *   each path types at PER_CHAR_MS=5 (same rate as body)
 *   80ms pause between paths
 *
 * SSR + no-JS + reduced-motion: initial state is the FULL list
 * with all 3 paths so the static final paint never shows empty
 * rows.
 */

const PATHS = [
  "apps/web/src/app/globals.css",
  "apps/web/src/app/settings/page.tsx",
  "apps/web/src/components/DigestView.tsx",
];

const START_DELAY_MS = 1700;
const PER_CHAR_MS = 5;
const PATH_GAP_MS = 80;

export function FeaturesResumeKeyFiles() {
  const phase = useContext(FeaturesPhaseContext);
  // Initial state: ALL paths fully rendered. SSR + no-JS + the
  // "done" / reduced-motion path all paint this immediately so
  // nothing is ever blank.
  const [displayed, setDisplayed] = useState<string[]>(PATHS);

  useEffect(() => {
    if (phase !== "playing") return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Reset all paths to empty when the cascade starts.
    setDisplayed(PATHS.map(() => ""));

    // Schedule each path's typewriter — path n starts after
    // every previous path has finished + the gap.
    let elapsed = START_DELAY_MS;
    PATHS.forEach((path, pathIndex) => {
      const pathStart = elapsed;
      // Type the path char-by-char.
      for (let i = 1; i <= path.length; i++) {
        const tickAt = pathStart + i * PER_CHAR_MS;
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            setDisplayed((prev) => {
              const next = [...prev];
              next[pathIndex] = path.slice(0, i);
              return next;
            });
          }, tickAt),
        );
      }
      // Move the cursor to the start of the next path.
      elapsed = pathStart + path.length * PER_CHAR_MS + PATH_GAP_MS;
    });

    return () => {
      cancelled = true;
      timers.forEach((id) => clearTimeout(id));
    };
  }, [phase]);

  return (
    <>
      {PATHS.map((fullPath, i) => (
        <div key={fullPath} className="home-features-resume-file">
          <span className="home-features-resume-bullet" aria-hidden />
          <span>{displayed[i] ?? ""}</span>
        </div>
      ))}
    </>
  );
}
