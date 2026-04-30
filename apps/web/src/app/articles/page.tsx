import Link from "next/link";

export const metadata = {
  title: "Articles | askscout",
  description: "Writing on vibe coding, AI-assisted development, and the daily-digest workflow.",
};

/**
 * Articles index. Lists every long-form post on the site.
 *
 * Adding a new article: create
 *   apps/web/src/app/articles/<slug>/page.tsx
 * with the article content, then add an entry to the ARTICLES
 * array below. Order is newest-first (the array is rendered top
 * to bottom as-is — no auto-sort by date — so editorial order
 * is intentional).
 */

interface ArticleListing {
  /** URL slug — must match the directory name under /articles. */
  slug: string;
  /** Display title (matches the H1 on the article page). */
  title: string;
  /** One-line preview shown on the index page. */
  description: string;
  /** ISO date for sorting / display. */
  date: string;
}

const ARTICLES: ArticleListing[] = [
  {
    slug: "the-hidden-cost-of-vibe-coding",
    title: "The Hidden Cost of Vibe Coding",
    description:
      "AI coding tools made us faster. They also made it harder to remember what we actually built. The case for a daily digest in the vibe-coding era.",
    date: "2026-04-30",
  },
];

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ArticlesIndexPage() {
  return (
    <main className="public-page">
      <nav className="public-nav">
        <Link href="/" className="public-nav-logo">
          askscout
        </Link>
        <div className="public-nav-links">
          <Link href="/articles">Articles</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </nav>

      <div className="public-content">
        <h1 className="public-title">Articles</h1>
        <p className="public-text">
          Writing on vibe coding, AI-assisted development, and how we think about the daily-digest
          workflow.
        </p>

        <ul className="article-list">
          {ARTICLES.map((article) => (
            <li key={article.slug} className="article-list-item">
              <Link href={`/articles/${article.slug}`} className="article-list-link">
                <span className="article-list-date">{formatDate(article.date)}</span>
                <h2 className="article-list-title">{article.title}</h2>
                <p className="article-list-description">{article.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
