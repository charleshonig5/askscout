"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * The theme persists via a cookie that the server reads in layout.tsx
 * to set <html data-theme="..."> at SSR time. Because the server has
 * already rendered the correct attribute, the initial client state
 * matches the DOM exactly — no flash, no hydration mismatch, no
 * mount-gate workaround needed.
 */
function readInitialTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(readInitialTheme);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    // 1-year cookie, current host only. SameSite=Lax is safe for
    // first-party preference cookies and works across navigations.
    // Reading it back happens server-side in layout.tsx so the next
    // page load (full nav OR fresh tab) renders the correct theme
    // immediately — no client-side bootstrap dance.
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `theme=${next}; path=/; max-age=${oneYear}; SameSite=Lax`;
  };

  return (
    <button className="header-icon-btn" onClick={toggle} aria-label="Toggle theme">
      {theme === "light" ? <Moon size={20} strokeWidth={1} /> : <Sun size={20} strokeWidth={1} />}
    </button>
  );
}
