import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { ArticleControls } from "@/components/ArticleControls";
import { ARTICLES } from "@/lib/articles-data";

export const metadata = {
  title: "Articles | AskScout",
  description: "Writing on vibe coding, AI-assisted development, and the daily-digest workflow.",
  alternates: {
    types: {
      "application/atom+xml": [
        { url: "/dispatch", title: "AskScout Articles" },
      ],
    },
  },
};

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
    <main className="page">
      <nav className="home-nav" aria-label="Site">
        <Link href="/home" className="home-nav-logo">
          AskScout
        </Link>
        <div className="home-nav-links">
          <Link href="/articles">Articles</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/privacy">Privacy</Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero header — same eyebrow + display-font H1 treatment as the
          home page's section titles, just smaller (64px) since this
          isn't a marketing landing surface. */}
      <header className="page-header">
        <div className="page-header-inner">
          <p className="home-eyebrow">Writing</p>
          <div className="page-title-row">
            <h1 className="page-title">Articles</h1>
            <ArticleControls articles={ARTICLES} />
          </div>
          <p className="page-deck">
            Notes on vibe coding, AI-assisted dev work, and what we&apos;re learning about the
            daily-digest habit.
          </p>
        </div>
      </header>

      <div className="page-body">
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
      <SiteFooter />
    </main>
  );
}
