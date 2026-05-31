"use client";

import { useState } from "react";
import Link from "next/link";
import { Clock, SquareArrowUpRight } from "lucide-react";
import { ArticlesUtils } from "@/components/ArticlesUtils";
import { useSliderIndicator } from "@/lib/use-slider-indicator";
import type { ArticleListing, ArticleTag } from "@/lib/articles-data";

/**
 * Interactive controls + card grid for the articles index, per
 * Figma 256:4790.
 *
 * Owns the active tag filter ("All" | "Company" | "Guides").
 * Cards outside the active tag are removed via display:none
 * rather than dropped from the DOM so crawlers and AI search
 * bots still index every article without executing JS. The
 * Shuffle + RSS pair lives in <ArticlesUtils /> and is rendered
 * once here (visible on desktop, hidden on mobile) and once in
 * the page hero (hidden on desktop, visible on mobile) — same
 * buttons, two slots, CSS-toggled per viewport.
 *
 * The page H1 ("Articles") lives in the server-rendered hero
 * above this component, so each card title here is an <h2>.
 */

type FilterValue = "all" | ArticleTag;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "Company", label: "Company" },
  { value: "Guides", label: "Guides" },
];

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ArticlesIndexInteractive({
  articles,
}: {
  articles: ArticleListing[];
}) {
  const [filter, setFilter] = useState<FilterValue>("all");
  // Sliding-pill indicator — same useSliderIndicator hook that
  // powers the FAQ tabs' active-pill slide, so motion across the
  // marketing site (filter chips + FAQ tabs) reads as one
  // coherent pattern.
  const indicatorData = useSliderIndicator(filter);

  return (
    <div className="articles-index">
      {/* Controls row — filter chips on the left, shuffle + RSS on
          the right. Filter chips behave as a segmented control:
          one active at a time, click to switch. */}
      <div className="articles-controls">
        <div
          ref={(el) => {
            indicatorData.containerRef.current = el;
          }}
          className="articles-filter"
          role="tablist"
          aria-label="Filter articles by tag"
        >
          {/* Indicator pill — see .articles-filter-indicator in
              globals.css and the matching .home-faq-tab-indicator
              for the shared pattern. */}
          <span
            className="articles-filter-indicator"
            aria-hidden
            style={
              indicatorData.indicator
                ? {
                    left: `${indicatorData.indicator.left}px`,
                    width: `${indicatorData.indicator.width}px`,
                    opacity: 1,
                  }
                : { opacity: 0 }
            }
          />
          {FILTERS.map((f) => {
            const isActive = filter === f.value;
            return (
              <button
                key={f.value}
                ref={indicatorData.setItemRef(f.value)}
                role="tab"
                type="button"
                aria-selected={isActive}
                className={`articles-filter-chip${
                  isActive ? " articles-filter-chip--active" : ""
                }`}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <ArticlesUtils articles={articles} variant="controls" />
      </div>

      {/* Card grid — every article rendered into the initial HTML
          so search + AI crawlers see all of them without running
          the filter. Inactive cards toggle to display:none via the
          --hidden modifier. */}
      <ul className="articles-grid">
        {articles.map((a) => {
          const visible = filter === "all" || a.tag === filter;
          return (
            <li
              key={a.slug}
              className={`articles-card-wrap${
                visible ? "" : " articles-card-wrap--hidden"
              }`}
            >
              <Link href={`/articles/${a.slug}`} className="articles-card">
                <div className="articles-card-body">
                  <div className="articles-card-tags">
                    <span className="articles-card-tag">{a.tag}</span>
                    <span className="articles-card-tag">
                      <span>{a.readTime} min read</span>
                      <Clock size={10} strokeWidth={1.5} aria-hidden />
                    </span>
                  </div>
                  <div className="articles-card-headblock">
                    <h2 className="articles-card-title">{a.title}</h2>
                    <p className="articles-card-desc">{a.description}</p>
                  </div>
                </div>
                <div className="articles-card-footer">
                  <span className="articles-card-read">
                    <span>Read More</span>
                    <SquareArrowUpRight
                      size={16}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </span>
                  <span className="articles-card-date">
                    {formatDate(a.date)}
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
