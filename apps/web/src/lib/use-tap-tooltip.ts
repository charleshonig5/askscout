"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Simple tap-to-pin behavior for hover tooltips, so touch devices (phones,
 * tablets) aren't stuck without tooltip access.
 *
 * Desktop still works via CSS :hover as before — this hook adds a parallel
 * "tap to pin" path. Clicking/tapping the parent toggles a boolean; clicking
 * outside dismisses. CSS rules show the tooltip when EITHER :hover OR the
 * parent has the `tap-open` class.
 *
 * Usage:
 *   const { ref, open, toggle } = useTapTooltip<HTMLSpanElement>();
 *   <span
 *     ref={ref}
 *     onClick={toggle}
 *     className={`my-tooltip-parent ${open ? "tap-open" : ""}`}
 *   >...</span>
 */
export function useTapTooltip<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  open: boolean;
  toggle: (e?: React.MouseEvent) => void;
  close: () => void;
} {
  const ref = useRef<T | null>(null);
  const [open, setOpen] = useState(false);

  // Dismiss on any click/tap outside the element.
  useEffect(() => {
    if (!open) return;
    const handler = (e: Event) => {
      const target = e.target as Node | null;
      if (target && ref.current && !ref.current.contains(target)) {
        setOpen(false);
      }
    };
    // `click` fires after mousedown/touchend so it's the natural outside-dismiss
    // signal. We listen in the capture phase to get the outside click even if
    // a descendant stops propagation.
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [open]);

  const toggle = useCallback((e?: React.MouseEvent) => {
    // Don't let the document-level handler dismiss us on the same click that
    // opened us.
    e?.stopPropagation();
    setOpen((v) => !v);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return { ref, open, toggle, close };
}
