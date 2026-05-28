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
  const article = ARTICLES.find((a) => a.slug === opts.slug);
  const date = article?.date ?? "";
  const tag = article?.tag;
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
    /* articleSection + keywords come from the canonical tag in
     * ARTICLES. articleSection is the schema.org-recognized field
     * for topical classification (helps AI search engines bucket
     * the article); keywords is the broader hint many crawlers
     * (and Google's articleSection autodetection) look at too. */
    ...(tag ? { articleSection: tag, keywords: tag } : {}),
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

/**
 * Builds a BreadcrumbList JSON-LD trail for an article page:
 *   Home > Articles > [Article Title]
 *
 * Per Google's breadcrumb guidelines the final item represents the
 * current page and intentionally omits the `item` (URL) property —
 * search engines treat the last ListItem as "you are here" and use
 * its `name` for the rendered breadcrumb leaf.
 * Ref: https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
 */
export function articleBreadcrumbJsonLd(opts: { slug: string; title: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Articles",
        item: `${SITE}/articles`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: opts.title,
      },
    ],
  };
}
