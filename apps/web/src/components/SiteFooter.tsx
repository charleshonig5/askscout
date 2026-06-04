import Link from "next/link";
import { SquareArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { GitHubMark } from "@/components/GitHubMark";
import { ARTICLES } from "@/lib/articles-data";

/** How many of the most-recent articles render in the footer column
 *  before the "Read more" link takes over. Mirrors the article cards
 *  pattern in <ArticlesIndexInteractive /> — title-only entries here,
 *  with the full descriptions visible on /articles. */
const FOOTER_ARTICLE_COUNT = 4;

/**
 * Site footer per Figma 484:1271. Two-block layout: the brand
 * (editorial pull-line + status pill + GitHub/copyright row) on the
 * left, and three nav columns (Product / Navigation / Articles) on
 * the right.
 *
 * The pull-line replaces the previous standalone logo: the askScout
 * wordmark sits inline with a Pridi 20px tagline ("is your morning
 * code briefing in 10 seconds. Crafted with care in Chicago, IL.")
 * so the footer reads like a hand-set masthead instead of a generic
 * SaaS chrome strip. Mixed Pridi weights (Regular for the two
 * emphasized phrases, ExtraLight for the rest) carry the editorial
 * voice the marketing brand wants.
 *
 * Used on every public marketing surface (home, articles, docs,
 * privacy) so the chrome stays consistent. Theme toggle lives in
 * the top nav, not the footer — Figma drops it from this layout.
 */
export function SiteFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        {/* Left column wrapper holds the brand block + copyright row
            stacked vertically. On DESKTOP this owns the 34px gap
            between brand-bottom and copyright per Figma 484:1271,
            because if we let the outer grid handle it the copyright
            would float to the bottom of the (taller) right column.
            On MOBILE the wrapper uses display:contents so brand and
            copyright become direct flex items of .home-footer-inner,
            letting copyright sit at the very bottom of the column
            stack via order: 99. */}
        <div className="home-footer-left">
          <div className="home-footer-brand">
            {/* Editorial pull-line: the askScout wordmark flows inline
              with the marketing copy in Pridi 20px. The two <strong>
              phrases ("code briefing" and "Chicago, IL.") render at
              Pridi Regular while the rest is ExtraLight, creating
              the hand-set tone the marketing brand calls for. */}
            <p className="home-footer-pullline">
              <Link href="/" className="home-footer-pullline-logo" aria-label="askScout home">
                <Logo height={20} alt="" />
              </Link>{" "}
              is your morning <strong>code briefing</strong> in 10 seconds. Crafted with care in{" "}
              <strong>Chicago, IL.</strong>
            </p>
            {/* Status pill — boxed treatment (bg + 1px border) instead
              of the previous transparent inline chip so it reads as
              a surfaced "live signal" element next to the editorial
              pull-line. Pulse keyframe + green dot unchanged. */}
            <span className="home-footer-status" role="status" aria-label="All systems operational">
              <span className="home-footer-status-dot" aria-hidden />
              All systems operational
            </span>
          </div>
          {/* Copyright row sits BELOW brand on desktop; the
            .home-footer-left wrapper owns the 34px gap. On mobile
            it gets unwrapped via display:contents and re-ordered to
            the very bottom of the column stack. */}
          <div className="home-footer-copyright-row">
            <a
              href="https://github.com/charleshonig5/askscout"
              target="_blank"
              rel="noopener noreferrer"
              className="home-footer-github"
              aria-label="askScout on GitHub"
            >
              <GitHubMark size={22} />
            </a>
            <p className="home-footer-copy">© 2026 askScout</p>
          </div>
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
                provides the path to the full index.

                The list + the "Read more" link share a single
                wrapping div with the same 14px gap the article
                <li>s already use, so the spacing between the last
                article row and the "Read more" link matches the
                article-to-article spacing exactly. Without this
                wrapper the parent column's 24px gap stacked with
                the CTA's margin to produce ~38px instead. */}
            <div className="home-footer-col-articles">
              <ul className="home-footer-col-list">
                {ARTICLES.slice(0, FOOTER_ARTICLE_COUNT).map((article) => (
                  <li key={article.slug}>
                    {/* title= surfaces the full article title via
                        browser tooltip on hover, since the link
                        text itself truncates with an ellipsis at
                        the column's 280px boundary. */}
                    <Link href={`/articles/${article.slug}`} title={article.title}>
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
              {/* "Read more" mirrors .articles-card-read 1:1 — see
                  globals.css for the rationale. */}
              {ARTICLES.length > FOOTER_ARTICLE_COUNT && (
                <Link href="/articles" className="home-footer-col-cta">
                  <span>Read more</span>
                  <SquareArrowUpRight size={16} strokeWidth={1.5} aria-hidden />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
