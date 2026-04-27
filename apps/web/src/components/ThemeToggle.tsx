"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Lazy-initialize state from the DOM's `data-theme` attribute (which
 * the inline pre-hydration script in layout.tsx already set correctly
 * from localStorage). Skipping the old useEffect-after-mount sync
 * avoids the 2-click flip bug — state and DOM are aligned from the
 * very first render.
 */
function readInitialTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(readInitialTheme);
  // Render-gate: server-side render + first client paint show an
  // empty button. That's because readInitialTheme returns "dark" on
  // the server (no document) but might return "light" on the client
  // — rendering the icon based on state would cause a hydration
  // mismatch warning for light-mode users. Once mounted flips on the
  // client, state is already correct and the icon renders cleanly.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage failures are silent — theme stays session-only.
    }
  };

  return (
    <button className="header-icon-btn" onClick={toggle} aria-label="Toggle theme">
      {mounted ? (
        theme === "light" ? (
          <Moon size={20} strokeWidth={1} />
        ) : (
          <Sun size={20} strokeWidth={1} />
        )
      ) : null}
    </button>
  );
}
