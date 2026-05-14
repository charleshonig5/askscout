"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ForceDarkTheme } from "@/components/ForceDarkTheme";

/**
 * Marketing-site top nav (Figma node 244:2962).
 *
 * Shared across every public marketing surface (/home, /docs,
 * /articles, /privacy, and every article subpage) so visual updates
 * happen in one file. Active-link detection uses next/navigation's
 * usePathname so the right link auto-highlights wherever this
 * component is rendered — no per-page "current" prop needed.
 *
 * Layout (left → right): logo · vertical divider · Home / Docs /
 * Articles / Privacy · spacer · Open App button.
 *
 * Marketing is dark-mode-only — the theme toggle was removed
 * because the light treatment doesn't land on the marketing
 * visual language. <ForceDarkTheme /> sits at the top of the
 * nav and pins data-theme="dark" on the html element without
 * touching the cookie, so the dashboard's per-user theme
 * preference is preserved across navigations.
 */
const NAV_LINKS: Array<{ href: string; label: string; matchPrefix?: string }> = [
  { href: "/home", label: "Home" },
  { href: "/docs", label: "Docs" },
  { href: "/articles", label: "Articles", matchPrefix: "/articles" },
  { href: "/privacy", label: "Privacy" },
];

export function MarketingNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="home-nav" aria-label="Site">
      <ForceDarkTheme />
      <Link href="/home" className="home-nav-logo" aria-label="AskScout home">
        <Logo height={20} />
      </Link>
      <span className="home-nav-divider" aria-hidden />
      <div className="home-nav-links">
        {NAV_LINKS.map((link) => {
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
        })}
      </div>
      <div className="home-nav-right">
        <Link href="/dashboard" className="home-nav-open-app">
          Open app
        </Link>
      </div>
    </nav>
  );
}
