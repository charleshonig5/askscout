"use client";

import { Menu, X, ChartPie, Settings2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./Logo";

interface HeaderProps {
  onMenuToggle?: () => void;
  /** When the mobile drawer is open the hamburger flips to an X
   *  glyph so the same 40×40 button doubles as a close affordance,
   *  matching Figma node 287:3311. */
  isOpen?: boolean;
  /** Settings + Insights pages have no repo/history switcher to
   *  open, so the hamburger is hidden and the logo lockup shifts
   *  to the 24px gutter (Figma node 289:7570). Default true for the
   *  dashboard. */
  showMenu?: boolean;
}

/**
 * Mobile-only top chrome (Figma node 287:3361).
 *
 * Matches the digest-page mobile header exactly:
 *   - 68px tall, full width, dark bg, 1px bottom border.
 *   - Bordered 40×40 hamburger button on the left at 24px inset.
 *   - AskScout logo lockup centered horizontally to the left of the
 *     right-side action cluster (logo + 14px gap + 2 icons).
 *   - Two icon buttons on the right (Insights + Settings) with 14px
 *     between them, mirroring the top of the desktop sidebar's
 *     action group so navigation feels continuous between layouts.
 *
 * Hidden on desktop (the sidebar handles all this when it's visible).
 * The hamburger calls `onMenuToggle` to slide the sidebar in over
 * the page on mobile, where the sidebar carries its own copies of
 * the same controls plus repo picker + history list.
 */
export function Header({ onMenuToggle, isOpen = false, showMenu = true }: HeaderProps) {
  const router = useRouter();
  return (
    <header
      className={`header${isOpen ? " header--drawer-open" : ""}${showMenu ? "" : " header--no-menu"}`}
    >
      {showMenu && (
        <button
          type="button"
          className="header-hamburger"
          onClick={onMenuToggle}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <X size={20} strokeWidth={1} aria-hidden />
          ) : (
            <Menu size={20} strokeWidth={1} aria-hidden />
          )}
        </button>
      )}
      <Link href="/dashboard" className="header-logo" aria-label="AskScout home">
        <Logo height={21} />
      </Link>
      <div className="header-actions">
        <button
          type="button"
          className="header-icon-btn"
          onClick={() => router.push("/insights")}
          aria-label="Insights"
        >
          <ChartPie size={24} strokeWidth={1} aria-hidden />
        </button>
        <button
          type="button"
          className="header-icon-btn"
          onClick={() => router.push("/settings")}
          aria-label="Settings"
        >
          <Settings2 size={24} strokeWidth={1} aria-hidden />
        </button>
      </div>
    </header>
  );
}
