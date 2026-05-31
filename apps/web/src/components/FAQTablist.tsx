"use client";

import { useSliderIndicator } from "@/lib/use-slider-indicator";

/**
 * Shared tablist used by FAQTabs (home) and DocsFAQ (docs). Renders
 * the segmented tab buttons inside the existing .home-faq-tabs
 * rounded container, plus a single absolutely-positioned indicator
 * element that animates its left + width to slide between active
 * tabs.
 *
 * Indicator positioning is handled by the useSliderIndicator hook
 * (lib/use-slider-indicator) — same hook drives the articles-page
 * filter chips for visual cohesion across the marketing site.
 *
 * The indicator carries the bg-secondary + border + glow visual
 * that .home-faq-tab--active used to apply directly. The active
 * tab's --active modifier now only flips the text color to white;
 * the moving background is owned by the single indicator element.
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
  const { containerRef, setItemRef, indicator } = useSliderIndicator(active);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
      }}
      className="home-faq-tabs"
      role="tablist"
      aria-label={ariaLabel}
    >
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
      {tabs.map((t) => (
        <button
          key={t.id}
          ref={setItemRef(t.id)}
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
