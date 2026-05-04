import Link from "next/link";
import { Code2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Shared footer used on every public page (homepage, articles, docs,
 * privacy). Three rows: brand block + nav columns, giant wordmark,
 * socials + theme toggle + copyright. Mirrors the layout pattern
 * Letta and Vercel use; tokens are AskScout's own monochrome system.
 */
export function SiteFooter() {
  return (
    <footer className="home-footer">
      <div className="home-footer-inner">
        <div className="home-footer-top">
          <div className="home-footer-brand">
            <span className="home-footer-logo">AskScout</span>
            <span className="home-footer-tagline">The daily digest for vibe coders.</span>
          </div>
          <div className="home-footer-cols">
            <div className="home-footer-col">
              <span className="home-footer-col-title">Product</span>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/docs">CLI</Link>
            </div>
            <div className="home-footer-col">
              <span className="home-footer-col-title">Writing</span>
              <Link href="/articles">Articles</Link>
              <Link href="/articles/the-hidden-cost-of-vibe-coding">
                The Hidden Cost of Vibe Coding
              </Link>
            </div>
            <div className="home-footer-col">
              <span className="home-footer-col-title">Open source</span>
              <a
                href="https://github.com/charleshonig5/askscout"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <Link href="/privacy">Privacy</Link>
            </div>
          </div>
        </div>

        <div className="home-footer-wordmark" aria-hidden>
          AskScout
        </div>

        <div className="home-footer-bottom">
          <div className="home-footer-bottom-left">
            <a
              href="https://github.com/charleshonig5/askscout"
              target="_blank"
              rel="noopener noreferrer"
              className="home-footer-social"
            >
              <Code2 size={14} strokeWidth={1.5} aria-hidden />
              GitHub
            </a>
            <a href="mailto:charleshonigdesign@gmail.com" className="home-footer-social">
              Email
            </a>
          </div>
          <div className="home-footer-bottom-right">
            <span className="home-footer-copy">© 2026 AskScout</span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
