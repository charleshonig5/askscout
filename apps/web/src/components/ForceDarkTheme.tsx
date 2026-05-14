"use client";

import { useLayoutEffect } from "react";

/**
 * Forces the document into dark mode on marketing pages only.
 *
 * The root layout reads a `theme` cookie at SSR time and sets
 * <html data-theme="..."> accordingly. The dashboard, sidebar,
 * and ThemeToggle keep working off that cookie — we don't touch
 * it here. But on marketing surfaces (home, articles, docs,
 * privacy) we want dark only because the light treatment doesn't
 * land on the marketing visual language.
 *
 * This component sits inside MarketingNav (which renders on every
 * public surface) and synchronously sets data-theme="dark" before
 * the browser paints. If a user comes from the dashboard with a
 * `theme=light` cookie set, they'll see marketing in dark, but
 * their cookie is preserved so when they navigate back to the
 * dashboard their preference returns.
 *
 * useLayoutEffect runs synchronously after DOM mutations and
 * before paint, so client-side route changes are flash-free. On
 * an initial page load the SSR HTML may briefly carry the cookie
 * theme; the effect fires immediately on hydration to correct it.
 */
export function ForceDarkTheme() {
  useLayoutEffect(() => {
    if (document.documentElement.getAttribute("data-theme") !== "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  return null;
}
