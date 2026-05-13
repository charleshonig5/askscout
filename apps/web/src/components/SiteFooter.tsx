import Link from "next/link";
import { Logo } from "@/components/Logo";

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
            <ul className="home-footer-col-list">
              <li>
                <Link href="/articles/the-hidden-cost-of-vibe-coding">
                  The Hidden Cost of Vibe Coding
                </Link>
              </li>
              <li>
                <Link href="/articles/best-ways-to-track-what-you-shipped">
                  Best Ways to Track What You Shipped
                </Link>
              </li>
              <li>
                <Link href="/articles/how-askscout-summarizes-git">
                  How AskScout Summarizes Git
                </Link>
              </li>
              <li>
                <Link href="/articles/why-askscout-is-open-source">
                  Why AskScout Is Open Source
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
