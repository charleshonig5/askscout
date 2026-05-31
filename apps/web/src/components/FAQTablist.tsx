"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Shared tablist used by FAQTabs (home) and DocsFAQ (docs). Renders
 * the segmented tab buttons inside the existing .home-faq-tabs
 * rounded container, plus a single absolutely-positioned indicator
 * element that animates its left/width to slide between the active
 * tab buttons.
 *
 * Why a measured indicator instead of CSS-only:
 *   Tab labels have variable widths ("Getting started" vs "Product
 *   details" vs "Privacy & security"), so the buttons aren't equal-
 *   sized. A CSS-only approach using `calc(--active-index * width)`
 *   only works for equal tabs. Measuring each button's actual
 *   bounding rect after layout gives the indicator the right
 *   position for any label set.
 *
 * Re-measurement triggers:
 *   - Active tab change (most common — slide animation)
 *   - Tabs prop change (label/count edit during dev)
 *   - Window resize (font-rendering can shift tab widths)
 *   - First paint via useLayoutEffect (avoids a 1-frame flash at 0,0)
 *
 * The indicator carries the bg-secondary + border + glow visual
 * that .home-faq-tab--active used to apply directly. The active
 * tab's --active modifier now only flips the text color to white;
 * the moving background is owned by this single element.
 */

interface FAQTablistProps {
  tabs: Array<{ id: string; label: string }>;
  active: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  /** Prefix for the panel id this tab controls — e.g. "faq-panel"
   *  → aria-controls="faq-panel-start". Lets the same component
   *  serve home and docs without their tab ids colliding. */
  panelIdPrefix: string;
  /** Prefix for the tab's own id so aria-labelledby on the panel
   *  resolves. e.g. "faq-tab" → id="faq-tab-start". */
  tabIdPrefix: string;
}

export function FAQTablist({
  tabs,
  active,
  onChange,
  ariaLabel,
  panelIdPrefix,
  tabIdPrefix,
}: FAQTablistProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    const idx = tabs.findIndex((t) => t.id === active);
    const btn = tabRefs.current[idx];
    if (!container || !btn) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setIndicator({ left: bRect.left - cRect.left, width: bRect.width });
  }, [active, tabs]);

  // Re-measure on window resize. Tab widths can shift if web fonts
  // load after the initial measurement, or if the viewport changes
  // (the container is fixed-width but content reflow elsewhere can
  // still influence layout timing).
  useLayoutEffect(() => {
    const handler = () => {
      const container = containerRef.current;
      const idx = tabs.findIndex((t) => t.id === active);
      const btn = tabRefs.current[idx];
      if (!container || !btn) return;
      const cRect = container.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      setIndicator({ left: bRect.left - cRect.left, width: bRect.width });
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [active, tabs]);

  return (
    <div
      ref={containerRef}
      className="home-faq-tabs"
      role="tablist"
      aria-label={ariaLabel}
    >
      {/* Indicator — the moving pill that carries the bg-secondary
          + border + glow treatment under the active tab. Rendered
          once and translated; CSS transitions on left + width do
          the sliding. Hidden on the very first SSR paint (no
          measurements yet); revealed once useLayoutEffect runs
          immediately after first mount. */}
      <span
        className="home-faq-tab-indicator"
        aria-hidden
        style={
          indicator
            ? {
                left: `${indicator.left}px`,
                width: `${indicator.width}px`,
                opacity: 1,
              }
            : { opacity: 0 }
        }
      />
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            tabRefs.current[i] = el;
          }}
          role="tab"
          type="button"
          aria-selected={t.id === active}
          aria-controls={`${panelIdPrefix}-${t.id}`}
          id={`${tabIdPrefix}-${t.id}`}
          className={`home-faq-tab${t.id === active ? " home-faq-tab--active" : ""}`}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
