/**
 * Single source of truth for the articles list.
 *
 * Adding a new article: create
 *   apps/web/src/app/articles/<slug>/page.tsx
 * with the article content, then add an entry to ARTICLES below.
 *
 * Both the visible articles index (`apps/web/src/app/articles/page.tsx`)
 * and the Atom feed (`apps/web/src/app/dispatch/route.ts`) import
 * from here so the two stay in sync automatically. Order is
 * newest-first; the array is rendered top to bottom as-is, no
 * auto-sort, so editorial order is intentional.
 */

export interface ArticleListing {
  /** URL slug — must match the directory name under /articles. */
  slug: string;
  /** Display title (matches the H1 on the article page). */
  title: string;
  /** One-line preview shown on the index page and in the feed summary. */
  description: string;
  /** ISO date for sorting / display. */
  date: string;
}

export const ARTICLES: ArticleListing[] = [
  {
    slug: "introducing-askscout",
    title: "Introducing AskScout: your vibe coding companion",
    description:
      "AskScout reads your repo and writes you a daily digest of what you shipped. The companion tool for developers using Cursor, Claude Code, and Copilot.",
    date: "2026-05-08",
  },
  {
    slug: "how-askscout-summarizes-git",
    title: "How AskScout turns a noisy git log into a 10-second digest",
    description:
      "A walkthrough of how AskScout reads commits and diffs, computes structural signals, and uses a tuned LLM prompt to produce a readable digest.",
    date: "2026-05-07",
  },
  {
    slug: "why-askscout-is-open-source",
    title: "Why we made AskScout open source",
    description:
      "Trust matters more than moat for a tool that reads your code. Why AskScout is fully MIT, including the prompt.",
    date: "2026-05-06",
  },
  {
    slug: "fastest-way-to-give-claude-or-cursor-project-context",
    title: "The fastest way to bring Claude or Cursor up to speed on your project",
    description:
      "How to give Claude Code or Cursor a one-shot context block covering tech stack, recent work, current focus, and key files.",
    date: "2026-05-05",
  },
  {
    slug: "best-ways-to-track-what-you-shipped",
    title: "Best Ways to Track What You Shipped as a Developer",
    description:
      "Four real options for remembering what you built, ranked by how much effort each one costs you. Plus the tradeoffs nobody mentions.",
    date: "2026-05-04",
  },
  {
    slug: "best-ai-coding-tools-for-solo-developers",
    title: "Best AI Coding Tools for Solo Developers",
    description:
      "An honest read on Cursor, Claude Code, GitHub Copilot, and Aider. What each one is good at, and the layer they all leave out.",
    date: "2026-05-02",
  },
  {
    slug: "the-hidden-cost-of-vibe-coding",
    title: "The Hidden Cost of Vibe Coding",
    description:
      "AI coding tools made us faster. They also made it harder to remember what we actually built. The case for a daily digest in the vibe-coding era.",
    date: "2026-04-30",
  },
];
