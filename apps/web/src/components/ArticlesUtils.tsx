"use client";

import { useRouter } from "next/navigation";
import { Rss, Shuffle } from "lucide-react";
import type { ArticleListing } from "@/lib/articles-data";

/**
 * Shuffle + RSS button pair. Used in two places:
 *   - Inside the hero row on mobile (next to the "Articles" title)
 *   - Inside the controls row on desktop (right of the filter chips)
 *
 * Same buttons, two render slots, visibility toggled per viewport in
 * CSS via .articles-utils--hero / .articles-utils--controls. Lives
 * in its own client component so the page hero (a server component)
 * can include the buttons without becoming a client component itself.
 */
export function ArticlesUtils({
  articles,
  variant,
}: {
  articles: ArticleListing[];
  variant: "hero" | "controls";
}) {
  const router = useRouter();

  const openRandomArticle = () => {
    if (articles.length === 0) return;
    const idx = Math.floor(Math.random() * articles.length);
    router.push(`/articles/${articles[idx]!.slug}`);
  };

  return (
    <div className={`articles-utils articles-utils--${variant}`}>
      <button
        type="button"
        className="articles-util-btn"
        onClick={openRandomArticle}
        aria-label="Open a random article"
        title="Surprise me"
      >
        <span>Shuffle</span>
        <Shuffle size={16} strokeWidth={1.5} aria-hidden />
      </button>
      <a
        className="articles-util-icon-btn"
        href="/dispatch"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Subscribe via RSS"
        title="RSS"
      >
        <Rss size={16} strokeWidth={1.5} aria-hidden />
      </a>
    </div>
  );
}
