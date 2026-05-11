"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { useTapTooltip } from "@/lib/use-tap-tooltip";

interface TapTooltipSpanProps {
  /** Base class on the parent span. The component appends `tap-open`
   *  when its toggle state is open so the existing CSS selectors
   *  (e.g. `.foo.tap-open .tooltip`) light up the tooltip. */
  baseClassName: string;
  /** Aria label for the tap target. Falls back to the existing
   *  parent's aria-label when migrating from a plain span. */
  ariaLabel?: string;
  /** Make the span keyboard-focusable as a button. Defaults to true.
   *  Set to false when the parent is already a button (HTML doesn't
   *  allow tabbable elements inside <button>). */
  focusable?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Drop-in replacement for a tooltip-parent `<span>` that previously
 * only worked on `:hover`. Adds tap-to-toggle behavior on touch
 * devices via useTapTooltip — the parent gets the `tap-open` class
 * while the JS state is open, and the existing CSS selectors
 * (`.foo:hover .tooltip` for pointer devices, `.foo.tap-open .tooltip`
 * for touch + keyboard) decide visibility.
 *
 * Desktop behavior is preserved entirely by the CSS hover path; the
 * hook is purely an additive mobile affordance. The useTapTooltip
 * hook handles outside-tap dismissal and a 4-second auto-dismiss
 * timer so an opened tooltip never feels stuck.
 */
export function TapTooltipSpan({
  baseClassName,
  ariaLabel,
  focusable = true,
  style,
  children,
}: TapTooltipSpanProps) {
  const { ref, open, toggle } = useTapTooltip<HTMLSpanElement>();
  const className = open ? `${baseClassName} tap-open` : baseClassName;
  const onKeyDown = focusable
    ? (e: KeyboardEvent<HTMLSpanElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }
    : undefined;
  return (
    <span
      ref={ref}
      className={className}
      onClick={toggle}
      onKeyDown={onKeyDown}
      role={focusable ? "button" : undefined}
      tabIndex={focusable ? 0 : undefined}
      aria-label={ariaLabel}
      style={style}
    >
      {children}
    </span>
  );
}
