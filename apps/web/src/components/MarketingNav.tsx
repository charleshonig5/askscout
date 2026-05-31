"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, CircleX } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ForceDarkTheme } from "@/components/ForceDarkTheme";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

const GITHUB_URL = "https://github.com/charleshonig5/askscout";

/* GitHub mark (Figma 391:44). lucide-react dropped its brand icons,
   so the official mark is inlined. fill:currentColor lets the
   .home-nav-github color token drive it. */
function GithubMark() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17 1.0625C7.99885 1.0625 0.708333 8.35302 0.708333 17.3542C0.708333 24.5632 5.37182 30.6522 11.8478 32.8109C12.6623 32.9534 12.9678 32.4647 12.9678 32.037C12.9678 31.6501 12.9474 30.3671 12.9474 29.0027C8.85417 29.7562 7.79521 28.0048 7.46937 27.0884C7.28609 26.62 6.49187 25.1742 5.79948 24.7872C5.22927 24.4818 4.41469 23.7283 5.77911 23.7079C7.06208 23.6875 7.97849 24.8891 8.28396 25.3778C9.75021 27.8419 12.0921 27.1495 13.0289 26.7219C13.1715 25.6629 13.5991 24.9502 14.0675 24.5429C10.4426 24.1356 6.65479 22.7304 6.65479 16.4989C6.65479 14.7271 7.28609 13.2609 8.32469 12.1205C8.16177 11.7132 7.59156 10.0433 8.4876 7.80318C8.4876 7.80318 9.85203 7.37552 12.9678 9.47307C14.2711 9.10651 15.6559 8.92323 17.0407 8.92323C18.4255 8.92323 19.8103 9.10651 21.1136 9.47307C24.2294 7.35516 25.5939 7.80318 25.5939 7.80318C26.4899 10.0433 25.9197 11.7132 25.7568 12.1205C26.7954 13.2609 27.4267 14.7068 27.4267 16.4989C27.4267 22.7508 23.6185 24.1356 19.9936 24.5429C20.5842 25.052 21.0933 26.0295 21.0933 27.5568C21.0933 29.7358 21.0729 31.4872 21.0729 32.037C21.0729 32.4647 21.3784 32.9738 22.193 32.8109C28.6282 30.6522 33.2917 24.5429 33.2917 17.3542C33.2917 8.35302 26.0011 1.0625 17 1.0625V1.0625Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GithubLink() {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="home-nav-github"
      aria-label="askScout on GitHub"
    >
      <GithubMark />
    </a>
  );
}

/**
 * Marketing-site top nav (Figma node 391:31).
 *
 * Shared across every public marketing surface (/home, /docs,
 * /articles, /privacy, and every article subpage) so visual updates
 * happen in one file. Active-link detection uses next/navigation's
 * usePathname so the right link auto-highlights wherever this
 * component is rendered — no per-page "current" prop needed.
 *
 * Desktop (left → right): logo · spacer · Home / Docs / Articles /
 * Privacy · Open App button · GitHub icon.
 *
 * Mobile (≤768px): hamburger · logo · spacer · Open App. The
 * hamburger flips Menu ⇄ CircleX and toggles a full-screen menu
 * takeover carrying the four nav links + the GitHub mark, centered
 * — the toggle pattern is borrowed from the web app's <Header />.
 *
 * Marketing is dark-mode-only — <ForceDarkTheme /> pins
 * data-theme="dark" without touching the dashboard's theme cookie.
 */
const NAV_LINKS: Array<{ href: string; label: string; matchPrefix?: string }> = [
  { href: "/home", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/articles", label: "Articles", matchPrefix: "/articles" },
  { href: "/privacy", label: "Privacy" },
];

export function MarketingNav() {
  const pathname = usePathname() ?? "";
  const [menuOpen, setMenuOpen] = useState(false);

  // Lock body scroll while the mobile menu is open.
  useBodyScrollLock(menuOpen);

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close the menu if the viewport grows past the mobile breakpoint.
  // The hamburger (and the menu itself) are display:none on desktop,
  // so a menu left open across a resize would strand the body
  // scroll-lock with no visible affordance to release it.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 769px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);

  const renderLinks = () =>
    NAV_LINKS.map((link) => {
      const isActive =
        pathname === link.href ||
        (link.matchPrefix !== undefined && pathname.startsWith(link.matchPrefix));
      return (
        <Link
          key={link.href}
          href={link.href}
          className={isActive ? "home-nav-link is-active" : "home-nav-link"}
          aria-current={isActive ? "page" : undefined}
        >
          {link.label}
        </Link>
      );
    });

  return (
    <>
      <nav
        className={menuOpen ? "home-nav home-nav--menu-open" : "home-nav"}
        aria-label="Site"
      >
        <ForceDarkTheme />
        <Link href="/home" className="home-nav-logo" aria-label="askScout home">
          <Logo height={20} />
        </Link>

        {/* Desktop: inline link + action cluster. Hidden ≤768px. */}
        <div className="home-nav-right">
          <div className="home-nav-links">{renderLinks()}</div>
          <div className="home-nav-actions">
            <Link href="/dashboard" className="home-nav-open-app">
              Open app
            </Link>
            <GithubLink />
          </div>
        </div>

        {/* Mobile: hamburger toggles the full-screen menu. Hidden >768px. */}
        <button
          type="button"
          className="home-nav-hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="home-nav-menu"
        >
          {menuOpen ? (
            <CircleX size={20} strokeWidth={1} aria-hidden />
          ) : (
            <Menu size={20} strokeWidth={1} aria-hidden />
          )}
        </button>
      </nav>

      {/* Mobile full-screen menu — Figma 399:2929. A full-viewport
          takeover with the four nav links + the GitHub mark stacked
          and centered. Rendered as a SIBLING of <nav> (not a child)
          on purpose: the nav's backdrop-filter creates a containing
          block, so a position:fixed child would be trapped inside
          the 68px header box instead of filling the viewport. Sits
          at z-index 49 — just below the sticky nav (50) — so the
          header's close button stays on top and tappable. */}
      {menuOpen && (
        <div className="home-nav-menu" id="home-nav-menu">
          <div className="home-nav-menu-links">
            {renderLinks()}
            <GithubLink />
          </div>
        </div>
      )}
    </>
  );
}
