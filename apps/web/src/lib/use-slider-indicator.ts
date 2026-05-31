"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Hook that measures the active item's bounding rect inside a
 * container and returns the left + width to apply to a moving
 * "indicator" element. Powers the sliding pill behind segmented
 * tab controls — FAQ tabs (FAQTablist) and articles page filter
 * (ArticlesIndexInteractive).
 *
 * Why measured (not CSS-only):
 *   Items in these tablists have variable widths (label-driven),
 *   so a CSS calc(--active-index * width) doesn't work. Reading
 *   getBoundingClientRect after layout gives the indicator the
 *   exact position for whatever label set the consumer renders.
 *
 * Re-measures when:
 *   - `activeKey` changes (the common case — driving the slide)
 *   - `keys` array changes (label/count edited during dev iteration)
 *   - Window resize (font-load shifts, viewport changes)
 *   - First layout via useLayoutEffect (no 1-frame flash at 0,0)
 *
 * Returns:
 *   - `containerRef` — attach to the wrapping element
 *   - `setItemRef(key)` — ref-callback for each item element
 *   - `indicator` — `{ left, width } | null`; null on first SSR
 *     paint before measurement, then concrete values from there on.
 *     Consumer can use `null` to set opacity 0 so the indicator
 *     doesn't flash at the top-left corner before measure.
 */
export function useSliderIndicator<TKey extends string>(
  keys: TKey[],
  activeKey: TKey,
) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Map<TKey, HTMLElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(
    null,
  );

  // Effect body declares its own measure() so the closure captures
  // only the deps we care about (activeKey + keys) — avoids the
  // exhaustive-deps trap that comes with an outer helper function.
  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const item = itemRefs.current.get(activeKey);
      if (!container || !item) return;
      const cRect = container.getBoundingClientRect();
      const iRect = item.getBoundingClientRect();
      setIndicator({ left: iRect.left - cRect.left, width: iRect.width });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeKey, keys]);

  const setItemRef = (key: TKey) => (el: HTMLElement | null) => {
    if (el) itemRefs.current.set(key, el);
    else itemRefs.current.delete(key);
  };

  return { containerRef, setItemRef, indicator };
}
