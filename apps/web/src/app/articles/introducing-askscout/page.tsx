import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ArticleHero } from "@/components/ArticleHero";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { ReadyCTA } from "@/components/ReadyCTA";
import { articleJsonLd, articleBreadcrumbJsonLd } from "@/lib/article-jsonld";

export const metadata = {
  // Meta title/description deliberately diverge from the on-page H1
  // and deck. Body keeps the warmer launch-post voice
  // ("Introducing askScout: your vibe coding companion"); meta leads
  // with the keyword "daily code digest" because that's what
  // searchers actually type. Brand suffix dropped — "askScout"
  // already appears in the title.
  title: "Meet askScout: the daily code digest for AI-assisted devs",
  description:
    "askScout reads your repo and writes a daily digest of what you shipped. The companion tool for developers using Claude Code, Cursor, and Codex.",
  alternates: {
    canonical: "/articles/introducing-askscout",
  },
  openGraph: {
    title: "Meet askScout: the daily code digest for AI-assisted devs",
    description:
      "askScout reads your repo and writes a daily digest of what you shipped. The companion tool for developers using Claude Code, Cursor, and Codex.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meet askScout: the daily code digest for AI-assisted devs",
    description:
      "askScout reads your repo and writes a daily digest of what you shipped. The companion tool for developers using Claude Code, Cursor, and Codex.",
  },
};

const FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "What is a vibe coding companion?",
    a: "A vibe coding companion is a tool that supports the way most developers code now: describe what you want, accept AI patches, ship volume. askScout reads what you actually shipped each day and summarizes it in plain English so you can keep up with your own repo.",
  },
  {
    q: "Is askScout free to use?",
    a: "Yes. The web app is free with a soft cap of 30 digests per day. The CLI is free open-source software under MIT, with you bringing your own LLM API key (a fraction of a cent per run). No paid tier, no upsell.",
  },
  {
    q: "Does askScout work with Claude Code, Cursor, and Codex?",
    a: "Yes. askScout does not replace Claude Code, Cursor, or Codex. It runs after them. They write code; askScout reads what you wrote and produces a daily digest. Most users run one of the AI coding tools all day and read askScout once at the end.",
  },
  {
    q: "How is askScout different from Claude Code, Cursor, or Codex?",
    a: "Those tools write code. askScout does not write code at all. It reads your git history (commits and diffs) and writes a plain-English summary of what shipped, what changed, and what you left off. Different layer, different job.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_PLAIN.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const ARTICLE_SCHEMA = articleJsonLd({
  slug: "introducing-askscout",
  headline: "Introducing askScout: your vibe coding companion",
  description:
    "askScout reads your repo and writes you a daily digest of what you shipped. The companion tool for developers using Claude Code, Cursor, and Codex.",
});

const BREADCRUMB_SCHEMA = articleBreadcrumbJsonLd({
  slug: "introducing-askscout",
  title: "Introducing askScout: your vibe coding companion",
});

export default function IntroducingAskScoutPage() {
  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_SCHEMA) }}
      />
      <MarketingNav />

      <ArticleHero
        slug="introducing-askscout"
        title="Introducing askScout: your vibe coding companion"
        deck="askScout reads your repo and writes you a daily digest of what you shipped. The companion tool for developers using Claude Code, Cursor, and Codex."
      />

      <article className="page-body page-body--reading article article--has-hero">
        <p className="public-text article-tldr">
          <strong>TLDR:</strong> askScout is a daily digest tool for developers who code with AI
          assistance. Claude Code, Cursor, and Codex help you write code. askScout reads what you
          wrote and writes you back a quick summary covering what shipped, what changed, what kept
          getting reworked, and what you left off. The web app runs in your browser, signed in with
          GitHub. The CLI runs in any local git repo with your own LLM key. Both are free, both are
          open source.
        </p>

        <section className="public-section">
          <h2 className="public-section-title">The problem AI coding tools created</h2>
          <p className="public-text">
            Output per developer has gone up sharply since AI coding tools landed. The typing got
            fast. The remembering did not.
          </p>
          <p className="public-text">
            Friday afternoon you close your laptop and you cannot account for half of what your repo
            does. Your git log is illegible. Your standup is a guess. Monday morning you spend an
            hour reading your own diffs to onboard yourself. (We wrote about this in{" "}
            <Link href="/articles/the-hidden-cost-of-vibe-coding" className="home-prose-link">
              The Hidden Cost of Vibe Coding
            </Link>
            .)
          </p>
          <p className="public-text">
            askScout exists because that gap kept getting wider, and nothing in the existing tooling
            closed it.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What askScout actually does</h2>
          <p className="public-text">
            Run askScout in any git repo and it reads your commits and diffs since your last run. It
            groups what it finds into four sections: Shipped (things that went from not existing to
            working), Changed (things that already existed and got modified), Still Shifting (areas
            reworked 3+ times in the window), and Left Off (anything in progress when work stopped).
          </p>
          <p className="public-text">
            Two more numbers come along for the ride: Codebase Health (Growth, Focus, Churn) and
            Pace Check (today versus your recent average). Both come from raw git data, not the LLM.
            (More on how the digest gets assembled in{" "}
            <Link href="/articles/how-askscout-summarizes-git" className="home-prose-link">
              How askScout turns a noisy git log into a 10-second digest
            </Link>
            .)
          </p>
          <p className="public-text">
            The whole digest is short enough to skim in about a minute. That is the constraint we
            built around. If it takes longer than that to read, you will skip it.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Two surfaces, one product</h2>
          <p className="public-text">
            askScout runs in two places. The web app at{" "}
            <Link href="/dashboard" className="home-prose-link">
              askscout.dev
            </Link>{" "}
            signs in with GitHub, picks a repo, and starts streaming. Your digest history saves
            under your account. The CLI installs with{" "}
            <code className="inline-code">npm install -g askscout</code>, lives in any local repo,
            and uses your own Anthropic or OpenAI API key. Full install steps are in the{" "}
            <Link href="/docs" className="home-prose-link">
              CLI docs
            </Link>
            .
          </p>
          <p className="public-text">
            Same digest format, different fits. Web is for hosted history and a 10-second sign-in.
            CLI is for local-only workflows and developers who want full control of their data.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What it is not</h2>
          <p className="public-text">
            askScout is not a code generator. It will not write your features or refactor your
            modules. Claude Code, Cursor, and Codex already do that, and they do it well. (If you're
            choosing between those, we wrote about that in{" "}
            <Link
              href="/articles/best-ai-coding-tools-for-solo-developers"
              className="home-prose-link"
            >
              Best AI Coding Tools for Solo Developers
            </Link>
            .)
          </p>
          <p className="public-text">
            askScout sits one layer above those tools. They write code. askScout reads what you
            wrote. The two are companions, not competitors.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Try it</h2>
          <p className="public-text">
            The web app takes about ten seconds: sign in with GitHub, pick a repo, watch the first
            digest stream in. The CLI takes about a minute: install, paste your API key, run{" "}
            <code className="inline-code">askscout</code> in any git repo.
          </p>
          <p className="public-text">
            Both surfaces are free. The CLI is open source under the{" "}
            <a
              href="https://opensource.org/license/mit/"
              target="_blank"
              rel="noopener noreferrer"
              className="home-prose-link"
            >
              MIT license
            </a>
            . Use it next to whatever AI coding tool already lives in your day.
          </p>
        </section>

        <ArticleFAQ items={FAQ_PLAIN} />
      </article>

      <ReadyCTA />
      <SiteFooter />
    </main>
  );
}
