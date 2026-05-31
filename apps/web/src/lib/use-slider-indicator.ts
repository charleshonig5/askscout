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
 *   - Window resize (font-load shifts, viewport changes)
 *   - First layout via useLayoutEffect (no 1-frame flash at 0,0)
 *
 * Earlier version of this hook also took a `keys` array in its
 * dep list. That caused an infinite render loop because consumers
 * recreated the array on every render: new reference → effect
 * fired → setIndicator → re-render → new reference, etc. The
 * effect only needs activeKey to look up the item ref, so the
 * array param is gone.
 *
 * Returns:
 *   - `containerRef` — attach to the wrapping element
 *   - `setItemRef(key)` — ref-callback for each item element
 *   - `indicator` — `{ left, width } | null`; null on first SSR
 *     paint before measurement, then concrete values from there on.
 *     Consumer can use `null` to set opacity 0 so the indicator
 *     doesn't flash at the top-left corner before measure.
 */
export function useSliderIndicator<TKey extends string>(activeKey: TKey) {
  const containerRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef<Map<TKey, HTMLElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(
    null,
  );

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
  }, [activeKey]);

  const setItemRef = (key: TKey) => (el: HTMLElement | null) => {
    if (el) itemRefs.current.set(key, el);
    else itemRefs.current.delete(key);
  };

  return { containerRef, setItemRef, indicator };
}
