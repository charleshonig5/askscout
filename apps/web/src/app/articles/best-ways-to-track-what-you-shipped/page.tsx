import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ArticleHero } from "@/components/ArticleHero";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { ReadyCTA } from "@/components/ReadyCTA";
import { articleJsonLd, articleBreadcrumbJsonLd } from "@/lib/article-jsonld";

export const metadata = {
  // Brand suffix dropped — "askScout" already appears in the
  // breadcrumb and OG chrome; the title was 62 chars + 11 with
  // the suffix, which truncated in the SERP snippet.
  title: "Best Ways to Track What You Shipped as a Developer",
  description:
    "An honest comparison of git log, GitHub Insights, dev journals, and automated digests for tracking what you actually built each week.",
  alternates: {
    canonical: "/articles/best-ways-to-track-what-you-shipped",
  },
  openGraph: {
    title: "Best Ways to Track What You Shipped as a Developer",
    description:
      "An honest comparison of git log, GitHub Insights, dev journals, and automated digests for tracking what you actually built.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Ways to Track What You Shipped as a Developer",
    description:
      "An honest comparison of the real options for tracking what you shipped each week.",
  },
};

const FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "What is the easiest way to track what I built this week?",
    a: "The fastest path is git log --since=\"1 week ago\" --oneline for a flat list of recent commits. If you want it summarized into plain English with sections for what shipped, what changed, and what you left off, an automated tool like askScout reads the same data and writes a digest.",
  },
  {
    q: "Does GitHub have a way to summarize my work?",
    a: "GitHub's Insights tab shows commits, pull requests, and code frequency over time. It is good for shape and volume. It will not tell you what you actually built, since it shows counts and graphs rather than a written summary.",
  },
  {
    q: "Should I keep a developer journal?",
    a: "It works if you commit to writing daily. Most developers do not. The honest tradeoff is that journals capture intent and reasoning but require ongoing effort. Automated digests miss the intent but never go stale because they read your real git history.",
  },
  {
    q: "Is there a free way to summarize my git activity?",
    a: "Yes. The git CLI ships with git shortlog, git log --stat, and git log -p for a structured view at no cost. askScout's CLI is also free open source software under MIT, with you bringing your own LLM API key (a fraction of a cent per run).",
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
  slug: "best-ways-to-track-what-you-shipped",
  headline: "Best Ways to Track What You Shipped as a Developer",
  description:
    "An honest comparison of git log, GitHub Insights, dev journals, and automated digests for tracking what you actually built each week.",
});

const BREADCRUMB_SCHEMA = articleBreadcrumbJsonLd({
  slug: "best-ways-to-track-what-you-shipped",
  title: "Best Ways to Track What You Shipped as a Developer",
});

export default function TrackWhatYouShippedPage() {
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
        slug="best-ways-to-track-what-you-shipped"
        title="Best Ways to Track What You Shipped as a Developer"
        deck="Four options that actually work, ranked by how much effort each one costs you. Plus the tradeoffs nobody mentions."
      />

      <article className="page-body page-body--reading article article--has-hero">
        <p className="public-text article-tldr">
          <strong>TLDR:</strong> If you want to remember what you shipped, you have four real
          options: scroll your git log, lean on GitHub&apos;s Insights tab, write things down
          manually, or run an automated digest tool. Git log is free but unreadable at scale.
          GitHub shows shape without substance. Manual journals work if you actually keep them.
          Automated digests handle the volume but cost a tiny amount per run. Pick by how much
          friction you tolerate.
        </p>

        <section className="public-section">
          <p className="public-text">
            Tracking what you shipped used to be a low-stakes problem. You wrote a handful of
            clean commits a day, the messages were yours, and you remembered the work because
            you typed it. That is not the world most developers live in anymore.
          </p>
          <p className="public-text">
            AI coding tools push the daily volume up sharply. The mental ownership doesn&apos;t
            keep pace. And by Friday you&apos;re looking at your own git history wondering what
            half of it does. (For the longer argument about why this happens, see{" "}
            <Link
              href="/articles/the-hidden-cost-of-vibe-coding"
              className="home-prose-link"
            >
              The Hidden Cost of Vibe Coding
            </Link>
            .)
          </p>
          <p className="public-text">
            So how do you keep up? Below are the four options that actually work, in order from
            zero-cost to most-automated.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Option 1: Read your git log</h2>
          <p className="public-text">
            The cheapest option is the one already on your machine. Run{" "}
            <code className="inline-code">git log --since=&quot;1 week ago&quot; --oneline</code>{" "}
            and you get a flat list of every commit from the past seven days, one per line. Add{" "}
            <code className="inline-code">--stat</code> if you want file change counts. Add{" "}
            <code className="inline-code">-p</code> if you want the actual diffs. Full options
            in the{" "}
            <a
              href="https://git-scm.com/docs/git-log"
              target="_blank"
              rel="noopener noreferrer"
              className="home-prose-link"
            >
              git-log documentation
            </a>
            .
          </p>
          <p className="public-text">
            The good case: it costs nothing, it lives next to your code, and you can pipe it
            anywhere.
          </p>
          <p className="public-text">
            The bad case: at AI-assisted volume with messages like{" "}
            <code className="inline-code">fix</code>, <code className="inline-code">wip</code>,
            and <code className="inline-code">update</code>, the log is illegible. You can scan
            it. You cannot understand it.
          </p>
          <p className="public-text">
            Use this when the week is small and the messages are real.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Option 2: GitHub Insights</h2>
          <p className="public-text">
            Every GitHub repo has an Insights tab. It shows commit frequency, code frequency, the
            contribution graph, and a pull-request summary. It is the easiest way to see the
            shape of your activity over time.
          </p>
          <p className="public-text">
            What Insights does well: at a glance, you can tell a busy week from a slow one. The
            green-square contribution graph is good for streaks. The pull-request list shows what
            crossed the finish line.
          </p>
          <p className="public-text">
            What Insights does badly: it shows counts. Counts are not summaries. Insights will
            tell you that you made 73 commits last week. It will not tell you what those commits
            did. If you want narrative, you have to read the diffs yourself.
          </p>
          <p className="public-text">
            Use this when you want a sense of pace, not detail.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Option 3: A developer journal</h2>
          <p className="public-text">
            The classic answer is to write things down. End of day, jot what you worked on. Some
            people use a plain text file. Others use Obsidian, Notion, or a daily-notes plugin.
          </p>
          <p className="public-text">
            Journals capture the one thing automated tools miss: intent. You can record why you
            did something, not just what changed. That context compounds over months.
          </p>
          <p className="public-text">
            The catch is that journals only work if you actually keep them. The first two weeks
            are easy. The third week you forget once. The fourth week you stop. I have started
            and abandoned more dev journals than I can count, and I run a daily-digest company.
          </p>
          <p className="public-text">
            Use this if you genuinely have the discipline. Most people do not, which is fine.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Option 4: An automated digest</h2>
          <p className="public-text">
            The newest option is to read what your repo did and turn it into a daily summary
            automatically.{" "}
            <Link
              href="/articles/introducing-askscout"
              className="home-prose-link"
            >
              askScout
            </Link>{" "}
            is one of these. So is anything you build yourself by piping git diffs into a
            ChatGPT or Claude prompt.
          </p>
          <p className="public-text">
            What you get is a written digest with sections: what shipped, what changed, what
            kept getting reworked, and where you left off. The output is short enough to skim
            in about a minute. The data is grounded in your actual commits, not your memory.
            (For a tour of how that grounding works,{" "}
            <Link
              href="/articles/how-askscout-summarizes-git"
              className="home-prose-link"
            >
              How askScout turns a noisy git log into a 10-second digest
            </Link>{" "}
            walks through the pipeline.)
          </p>
          <p className="public-text">
            What you give up is some control. The summary is the model&apos;s read of your
            diffs, not yours. If the model misreads a commit, the digest reflects that. You
            also pay a small LLM cost per run if you bring your own key (a fraction of a cent
            at default models). The hosted web app is free.
          </p>
          <p className="public-text">
            Use this when the volume is too high for the other options. For most AI-assisted
            developers, that is most days.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">How to pick</h2>
          <p className="public-text">
            If your week is small and your messages are good, git log is fine. Stop reading.
          </p>
          <p className="public-text">
            If you only need a sense of pace, the GitHub contribution graph is enough.
          </p>
          <p className="public-text">
            If you have the discipline to write daily and you care about intent, keep a journal.
            Just be honest about whether you will actually do it for more than two weeks.
          </p>
          <p className="public-text">
            If your week is AI-assisted-volume with messy auto-generated messages, the only
            option that scales is automation. Either build the prompt yourself or use a tool
            like askScout. The point is that something is reading your repo for you, because
            at this volume you are not going to.
          </p>
          <p className="public-text">
            The honest answer is that most developers will end up using two of these together. A
            digest for the daily readout, plus a journal for the weeks that actually matter. The
            tools are not in conflict.
          </p>
        </section>

        <ArticleFAQ items={FAQ_PLAIN} />
      </article>

      <ReadyCTA />
      <SiteFooter />
    </main>
  );
}
