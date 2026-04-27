"use client";

import { useState } from "react";
import { Sun, Moon } from "lucide-react";

/**
 * Lazy-initialize from the DOM's `data-theme` attribute (which the
 * inline pre-hydration script in layout.tsx already set correctly
 * from localStorage). Skipping the old useEffect avoids a window
 * where component state and DOM disagreed — if the user clicked
 * during that window the first click looked like a no-op and a
 * second click was needed to actually flip themes.
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
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Storage failures are silent — theme stays session-only.
    }
  };

  return (
    <button className="header-icon-btn" onClick={toggle} aria-label="Toggle theme">
      {theme === "light" ? <Moon size={20} strokeWidth={1} /> : <Sun size={20} strokeWidth={1} />}
    </button>
  );
}
