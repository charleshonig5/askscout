"use client";

import { Rss, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ArticleListing } from "@/lib/articles-data";

/**
 * Small control row for the articles index: a Shuffle button that
 * navigates to a random article, and an RSS button that opens the
 * Atom feed at /dispatch.
 *
 * Lives next to the page title. Icon-only with aria-labels and
 * native title tooltips so the chrome stays light.
 *
 * Shuffle is client-side because it has to roll a random index
 * and navigate via the router. The RSS button is a plain link;
 * it's grouped here so both controls share the same component
 * and visual rhythm.
 */
export function ArticleControls({ articles }: { articles: ArticleListing[] }) {
  const router = useRouter();

  const shuffle = () => {
    if (articles.length === 0) return;
    const idx = Math.floor(Math.random() * articles.length);
    const slug = articles[idx]!.slug;
    router.push(`/articles/${slug}`);
  };

  return (
    <div className="article-controls">
      <button
        type="button"
        className="header-icon-btn"
        onClick={shuffle}
        aria-label="Open a random article"
        title="Surprise me"
      >
        <Shuffle size={20} strokeWidth={1} />
      </button>
      <a
        className="header-icon-btn"
        href="/dispatch"
        aria-label="Subscribe via RSS"
        title="RSS feed"
      >
        <Rss size={20} strokeWidth={1} />
      </a>
    </div>
  );
}
