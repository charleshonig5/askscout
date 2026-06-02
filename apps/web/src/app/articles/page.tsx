import { MarketingNav } from "@/components/MarketingNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ReadyCTA } from "@/components/ReadyCTA";
import { ArticlesIndexInteractive } from "@/components/ArticlesIndexInteractive";
import { ArticlesUtils } from "@/components/ArticlesUtils";
import { ARTICLES } from "@/lib/articles-data";

export const metadata = {
  title: "Articles - Notes on vibe coding, AI tools, and shipping fast | askScout",
  description:
    "Essays on vibe coding, AI coding tools, and the workflow problems that come with shipping fast. From the team building askScout.",
  alternates: {
    canonical: "/articles",
    types: {
      "application/atom+xml": [{ url: "/dispatch", title: "askScout Articles" }],
    },
  },
  openGraph: {
    title: "Articles - Notes on vibe coding, AI tools, and shipping fast | askScout",
    description:
      "Essays on vibe coding, AI coding tools, and the workflow problems that come with shipping fast. From the team building askScout.",
    url: "/articles",
    siteName: "askScout",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Articles - Notes on vibe coding, AI tools, and shipping fast | askScout",
    description:
      "Essays on vibe coding, AI coding tools, and the workflow problems that come with shipping fast. From the team building askScout.",
  },
};

/* Blog/CollectionPage JSON-LD for AI search and rich results. Each
   article gets an embedded BlogPosting entry so crawlers don't have
   to follow individual links to understand the catalog. */
const BLOG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "askScout Articles",
  description: "Long-form writing from the askScout team.",
  url: "https://askscout.dev/articles",
  inLanguage: "en",
  publisher: {
    "@type": "Organization",
    name: "askScout",
    url: "https://askscout.dev",
  },
  blogPost: ARTICLES.map((a) => ({
    "@type": "BlogPosting",
    headline: a.title,
    description: a.description,
    url: `https://askscout.dev/articles/${a.slug}`,
    datePublished: a.date,
    keywords: a.tag,
    author: { "@type": "Organization", name: "askScout" },
  })),
};

export default function ArticlesIndexPage() {
  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BLOG_SCHEMA) }}
      />
      <MarketingNav />

      {/* ===========================================================
          ARTICLES — Figma 256:4790. One continuous section: Pridi
          52 hero up top, then a controls row (tag filter chips on
          the left, Shuffle + RSS on the right), then a 3-column
          card grid. No internal section dividers — the hero, the
          controls, and the grid all live inside .articles-inner
          with a 54px gap between the hero and the interactive
          block. =========================================================== */}
      <section className="articles-main">
        <div className="articles-inner">
          <div className="articles-hero">
            {/* Title + utility buttons share one row. On desktop the
                utils are hidden here and surface inside the controls
                row below (right of the filter chips). On mobile the
                utils render here next to the title and the controls
                row carries only the filter chips. */}
            <div className="articles-hero-row">
              <h1 className="articles-hero-title">Articles</h1>
              <ArticlesUtils articles={ARTICLES} variant="hero" />
            </div>
            <p className="articles-hero-deck">Long-form writing from the askScout team.</p>
          </div>
          <ArticlesIndexInteractive articles={ARTICLES} />
        </div>
      </section>

      <ReadyCTA />
      <SiteFooter />
    </main>
  );
}
