import { ARTICLES } from "@/lib/articles-data";

const SITE = "https://askscout.dev";

/**
 * Builds BlogPosting JSON-LD for an article page.
 *
 * The publish date comes from the ARTICLES record — the same source
 * the sitemap and Atom feed read — so it can't drift. Headline and
 * description are passed in by the page so they match its own H1 and
 * meta description exactly. Author/publisher mirror the docs page's
 * TechArticle schema for site-wide consistency.
 *
 * No `image` field: articles have no per-article OG image yet, and a
 * fabricated one would be worse than omitting it. Adding real article
 * images later would make these eligible for image rich results.
 */
export function articleJsonLd(opts: { slug: string; headline: string; description: string }) {
  const date = ARTICLES.find((a) => a.slug === opts.slug)?.date ?? "";
  const url = `${SITE}/articles/${opts.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.headline,
    description: opts.description,
    url,
    inLanguage: "en",
    datePublished: date,
    dateModified: date,
    author: { "@type": "Organization", name: "AskScout" },
    publisher: {
      "@type": "Organization",
      name: "AskScout",
      url: SITE,
      logo: {
        "@type": "ImageObject",
        url: `${SITE}/logo-white.svg`,
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}
