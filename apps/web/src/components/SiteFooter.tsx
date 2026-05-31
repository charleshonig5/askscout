import Link from "next/link";
import { SquareArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ARTICLES } from "@/lib/articles-data";

/** How many of the most-recent articles render in the footer column
 *  before the "Read more" link takes over. Mirrors the article cards
 *  pattern in <ArticlesIndexInteractive /> — title-only entries here,
 *  with the full descriptions visible on /articles. */
const FOOTER_ARTICLE_COUNT = 4;

/**
 * Site footer per Figma 244:2647. Two-block layout: the brand
 * (askscout logo + copyright) on the left, and three nav columns
 * (Product / Navigation / Articles) on the right with the same
 * 24px column-internal gap and a 144px brand→nav gutter.
 *
 * Used on every public marketing surface (home, articles, docs,
 * privacy) so the chrome stays consistent. Theme toggle lives in
 * the top nav, not the footer — Figma drops it from this layout.
 */
export function SiteFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div className="home-footer-brand">
          <Link href="/" className="home-footer-logo" aria-label="AskScout home">
            <Logo height={20} />
          </Link>
          <p className="home-footer-copy">© 2026 AskScout</p>
        </div>
        <div className="home-footer-cols">
          <div className="home-footer-col">
            <p className="home-footer-col-title">Product</p>
            <ul className="home-footer-col-list">
              <li>
                <Link href="/dashboard">Web App</Link>
              </li>
              <li>
                <Link href="/docs">CLI</Link>
              </li>
            </ul>
          </div>
          <div className="home-footer-col">
            <p className="home-footer-col-title">Navigation</p>
            <ul className="home-footer-col-list">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/articles">Articles</Link>
              </li>
              <li>
                <Link href="/docs">Docs</Link>
              </li>
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
            </ul>
          </div>
          <div className="home-footer-col">
            <p className="home-footer-col-title">Articles</p>
            {/* Render the first N articles from the canonical list
                so the footer auto-truncates as the catalog grows
                (previously hardcoded four titles by URL — drifted
                whenever a new article shipped). When the catalog
                holds more than N, the "Read more" link below
                provides the path to the full index. */}
            <ul className="home-footer-col-list">
              {ARTICLES.slice(0, FOOTER_ARTICLE_COUNT).map((article) => (
                <li key={article.slug}>
                  <Link href={`/articles/${article.slug}`}>{article.title}</Link>
                </li>
              ))}
            </ul>
            {/* "Read more" CTA mirrors the article-card pattern
                (<ArticlesIndexInteractive /> .articles-card-read) —
                same label-then-SquareArrowUpRight icon construction
                at the same 16px size + 1.5 stroke. Only renders
                when there are more articles than the footer shows,
                so we don't surface a redundant link on a complete
                catalog list. */}
            {ARTICLES.length > FOOTER_ARTICLE_COUNT && (
              <Link href="/articles" className="home-footer-col-cta">
                <span>Read more</span>
                <SquareArrowUpRight size={16} strokeWidth={1.5} aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
