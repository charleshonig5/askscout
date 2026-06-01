"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { CircleArrowLeft, Copy, Check, Clock } from "lucide-react";
import { ARTICLES } from "@/lib/articles-data";

interface ArticleHeroProps {
  /** Article slug — looks up tag, date, and read time from ARTICLES. */
  slug: string;
  /** Display title — the article H1. */
  title: string;
  /** One-to-two sentence deck shown under the title. */
  deck: string;
}

/** Format an ISO date ("2026-05-05") as "May 5, 2026". Parsed at local
    midnight so the day doesn't shift in negative-offset timezones. */
function formatArticleDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Article hero — Figma 257:4862. Title, italic deck, and a meta row
 * (Back to Articles + Copy URL on the left, category and read-time
 * pills, date on the right), followed by a full-bleed divider with
 * 104px of air on each side before the article body.
 *
 * Shared across every article page so the hero stays identical. Tag,
 * date, and read time come from the ARTICLES record matched by slug;
 * title and deck are passed in so each page keeps its own H1 text.
 */
export function ArticleHero({ slug, title, deck }: ArticleHeroProps) {
  const [copied, setCopied] = useState(false);
  const listing = ARTICLES.find((a) => a.slug === slug);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  return (
    <header className="article-hero">
      <div className="article-hero-inner">
        <h1 className="article-hero-title">{title}</h1>
        <p className="article-hero-deck">{deck}</p>
        <div className="article-hero-meta">
          <div className="article-hero-meta-left">
            <div className="article-hero-links">
              <Link href="/articles" className="article-hero-link">
                <CircleArrowLeft size={16} strokeWidth={1.5} aria-hidden />
                Back to Articles
              </Link>
              <button type="button" className="article-hero-link" onClick={handleCopy}>
                Copy URL
                {copied ? (
                  <Check size={16} strokeWidth={1.5} aria-hidden />
                ) : (
                  <Copy size={16} strokeWidth={1.5} aria-hidden />
                )}
              </button>
            </div>
            {listing && (
              <div className="article-hero-pills">
                <span className="article-hero-pill">{listing.tag}</span>
                <span className="article-hero-pill">
                  {listing.readTime} min read
                  <Clock size={10} strokeWidth={1.5} aria-hidden />
                </span>
              </div>
            )}
          </div>
          {listing && <span className="article-hero-date">{formatArticleDate(listing.date)}</span>}
        </div>
      </div>
      <hr className="article-hero-rule" />
    </header>
  );
}
