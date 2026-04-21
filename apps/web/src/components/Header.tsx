"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  onMenuToggle: () => void;
}

/**
 * Minimal top chrome. Only visible on mobile (CSS hides it on desktop) and
 * only contains the hamburger toggle for opening the sidebar. On desktop the
 * sidebar is always visible with the logo / settings / theme / profile all
 * living inside it, so no top bar is needed.
 */
export function Header({ onMenuToggle }: HeaderProps) {
  return (
    <header className="header">
      <button className="header-icon-btn sidebar-toggle" onClick={onMenuToggle} aria-label="Menu">
        <Menu size={16} />
      </button>
      <span className="logo">askscout</span>
    </header>
  );
}
