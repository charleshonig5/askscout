import type { MetadataRoute } from "next";

/* Robots source. Next compiles this into the live /robots.txt at
   build time. Crawlers are allowed everywhere by default, with
   explicit Disallow on auth-gated surfaces and API/internal routes
   so they never leak into search results. The Sitemap line points
   crawlers directly at the URL index emitted by sitemap.ts. */

export default function robots(): MetadataRoute.Robots {
  /* Auth-gated + internal surfaces that nothing should crawl.
   * Repeated below for the AI crawler rule so the disallow set is
   * consistent across every user-agent. */
  const disallowed = [
    "/api/",
    "/dashboard",
    "/dashboard/",
    "/settings",
    "/settings/",
    "/insights",
    "/dev/",
    "/admin",
  ];

  /* Explicit allow-list for AI crawlers, sourced from each vendor's
   * own user-agent documentation. Being explicit (instead of relying
   * on the wildcard `*`) signals deliberate consent and protects
   * against future changes to wildcard semantics for AI training.
   *
   *   OpenAI: GPTBot (training), OAI-SearchBot (SearchGPT index),
   *           ChatGPT-User (on-demand fetch when ChatGPT browses on
   *           behalf of a user). Source:
   *           https://platform.openai.com/docs/bots
   *
   *   Anthropic: ClaudeBot (training crawl), Claude-User (on-demand
   *           fetch for Claude.ai user requests), anthropic-ai
   *           (legacy / catch-all). Source:
   *           https://docs.anthropic.com/en/api/agents
   *
   *   Google: Google-Extended is the dedicated user-agent for
   *           Gemini training and Vertex AI Search grounding —
   *           separate from Googlebot (which is governed by the
   *           wildcard rule above). Source:
   *           https://developers.google.com/search/docs/crawling-indexing/overview-google-crawlers#google-extended
   *
   *   Perplexity: PerplexityBot (index for Perplexity Search),
   *           Perplexity-User (on-demand fetch). Source:
   *           https://docs.perplexity.ai/guides/bots
   *
   *   Apple: Applebot-Extended is the Apple Intelligence training
   *           opt-out user-agent (separate from Applebot for
   *           regular Spotlight/Siri indexing). Source:
   *           https://support.apple.com/en-us/119829
   *
   *   Common Crawl: CCBot powers the corpus many AI labs train on
   *           (including some foundation models). Source:
   *           https://commoncrawl.org/ccbot
   */
  const aiAgents = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-User",
    "anthropic-ai",
    "Google-Extended",
    "PerplexityBot",
    "Perplexity-User",
    "Applebot-Extended",
    "CCBot",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowed,
      },
      {
        userAgent: aiAgents,
        allow: "/",
        disallow: disallowed,
      },
    ],
    sitemap: "https://askscout.dev/sitemap.xml",
    host: "https://askscout.dev",
  };
}
