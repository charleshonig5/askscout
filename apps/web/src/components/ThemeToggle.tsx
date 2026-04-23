"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = document.documentElement.getAttribute("data-theme");
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <button className="header-icon-btn" onClick={toggle} aria-label="Toggle theme">
      {theme === "light" ? <Moon size={20} strokeWidth={1} /> : <Sun size={20} strokeWidth={1} />}
    </button>
  );
}
