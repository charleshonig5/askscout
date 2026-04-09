"use client";

import { useState, useEffect, useRef } from "react";

/** Animates a number from 0 to the target value over a duration.
 *  When `enabled` is false, returns the target value immediately. */
export function useCountUp(target: number, duration = 1000, enabled = true): number {
  const [value, setValue] = useState(enabled ? 0 : target);
  const startTime = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    if (target === 0) {
      setValue(0);
      return;
    }

    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic for a natural deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return value;
}
