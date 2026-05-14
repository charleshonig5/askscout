import type { MetadataRoute } from "next";
import { ARTICLES } from "@/lib/articles-data";

/* Sitemap source. Next compiles this into the live /sitemap.xml at
   build time so the URL list stays in sync with the App Router
   instead of going stale. Only public marketing/content routes are
   listed; auth-gated app surfaces (/dashboard, /settings) and
   internal pages (/dev/*, /insights, /home — which is a duplicate of
   /) are intentionally omitted.

   Article lastModified values come from the real publish dates in
   lib/articles-data.ts. Using new Date() for static content would
   tell Google every article was "just modified" on every deploy,
   which trains the crawler to ignore the freshness signal. */

const SITE = "https://askscout.dev";

/* "Last updated" date for the docs page. Mirrors the date shown in
   the docs hero and the dateModified in the TechArticle JSON-LD —
   bump all three together when the docs change. */
const DOCS_LAST_MODIFIED = new Date("2026-05-04");

/* Newest article date powers the /articles index lastModified, so
   the index freshness reflects when new content actually arrives. */
const ARTICLES_INDEX_LAST_MODIFIED = new Date(
  ARTICLES.map((a) => a.date).sort().at(-1) ?? "2026-05-01",
);

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE}/docs`,
      lastModified: DOCS_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE}/articles`,
      lastModified: ARTICLES_INDEX_LAST_MODIFIED,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...ARTICLES.map((article) => ({
      url: `${SITE}/articles/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    {
      url: `${SITE}/privacy`,
      /* Bump in lockstep with PRIVACY_LAST_UPDATED_ISO in
         app/privacy/page.tsx and the <time> element on the page. */
      lastModified: new Date("2026-05-04"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
