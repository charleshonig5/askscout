"use client";

import { useEffect } from "react";

/**
 * Locks the document body scroll while `active` is true, restoring
 * the previous overflow + padding values when it flips false or the
 * component unmounts.
 *
 * Why we also touch padding-right: on systems where the vertical
 * scrollbar takes up layout space (most desktop Windows/Linux,
 * Chrome with overlay scrollbars disabled), setting
 * `overflow: hidden` removes the scrollbar and shifts the page
 * content left by ~15px. We measure the gap (window.innerWidth -
 * documentElement.clientWidth) and add it back as right padding so
 * the page doesn't jitter when a modal opens or closes. Systems
 * with overlay scrollbars (macOS by default) report 0 here, so the
 * compensation no-ops cleanly.
 *
 * Multiple concurrent locks (rare in this app) are handled by
 * stacking — each useEffect snapshots the prior state and restores
 * it on cleanup, so unwinding in reverse order yields the original.
 */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    if (typeof document === "undefined") return;

    const body = document.body;
    const docEl = document.documentElement;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const scrollBarWidth = window.innerWidth - docEl.clientWidth;

    if (scrollBarWidth > 0) {
      body.style.paddingRight = `${scrollBarWidth}px`;
    }
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [active]);
}
