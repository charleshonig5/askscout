import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ArticleHero } from "@/components/ArticleHero";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { ReadyCTA } from "@/components/ReadyCTA";
import { articleJsonLd, articleBreadcrumbJsonLd } from "@/lib/article-jsonld";

export const metadata = {
  title: "The Hidden Cost of Vibe Coding | AskScout",
  description:
    "AI coding tools sped us up. They also made it harder to remember what we actually built. Why I think the next big workflow problem is digesting your own code.",
  alternates: {
    canonical: "/articles/the-hidden-cost-of-vibe-coding",
  },
  openGraph: {
    title: "The Hidden Cost of Vibe Coding",
    description:
      "AI coding tools sped us up. They also made it harder to remember what we actually built.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Hidden Cost of Vibe Coding",
    description:
      "AI coding tools sped us up. They also made it harder to remember what we actually built.",
  },
};

const FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "What is vibe coding?",
    a: "Vibe coding is the way most developers write code with AI assistance. You describe what you want, the model produces patches, you review and ship. Code volume is high. Mental ownership of any individual line is low.",
  },
  {
    q: "Why is it harder to remember code I built with AI?",
    a: "When you do not type the bytes, they do not stick in memory the same way. You know the AI built a feature. You don't recall the specifics. The faster you ship, the wider the gap gets between what's in your repo and what's in your head.",
  },
  {
    q: "Can I just read my git log to remember what I shipped?",
    a: "Probably not at AI-coding pace. Git log was built for slow, deliberate commits. A normal week of vibe coding produces fifty commits a day, often with auto-generated messages like 'fix' or 'wip.' Skimming that is not the same as understanding what changed.",
  },
  {
    q: "What is a daily code digest?",
    a: "A short, plain-English summary of what changed in your repo today. Sections cover what shipped, what changed, what kept getting reworked, and where you left off. The point is to be readable in 10 seconds, not to replace your git log.",
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
  slug: "the-hidden-cost-of-vibe-coding",
  headline: "The Hidden Cost of Vibe Coding",
  description:
    "AI coding tools sped us up. They also made it harder to remember what we actually built. Why I think the next big workflow problem is digesting your own code.",
});

const BREADCRUMB_SCHEMA = articleBreadcrumbJsonLd({
  slug: "the-hidden-cost-of-vibe-coding",
  title: "The Hidden Cost of Vibe Coding",
});

export default function HiddenCostPage() {
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
        slug="the-hidden-cost-of-vibe-coding"
        title="The Hidden Cost of Vibe Coding"
        deck="AI coding tools sped us up. They also made it harder to keep track of what we actually built. Why I think the next big workflow problem is digesting your own code."
      />

      <article className="page-body page-body--reading article article--has-hero">
        <p className="public-text article-tldr">
          <strong>TLDR:</strong> The way most of us code now produces more output than our
          brains can hold. AI tools took the friction out of writing code. They did not take the
          friction out of remembering it. By Friday afternoon you have shipped two hundred
          commits and you cannot account for half of them. The fix is a daily digest of what
          your repo actually did.
        </p>

        <section className="public-section">
          <p className="public-text">
            Friday, 5&nbsp;PM. You close your laptop. You shipped a lot this week. Two hundred
            commits, a handful of features, a refactor or two. Feels like a productive run.
          </p>
          <p className="public-text">
            Then your teammate asks: <em>&ldquo;What did you build this week?&rdquo;</em>
          </p>
          <p className="public-text">
            You stare at them. You pause for a second too long. Your brain is empty.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">A new pattern, a new problem</h2>
          <p className="public-text">
            The way most of us code now is fundamentally different from two years ago. We don&apos;t
            write line by line. We describe what we want, accept the patches, scan the diffs.
            Sometimes we don&apos;t even fully scan the diffs. The friction of producing code has
            basically disappeared.
          </p>
          <p className="public-text">
            What hasn&apos;t disappeared: the cost of remembering what we actually shipped.
          </p>
          <p className="public-text">
            This is what vibe coding looks like in practice. The work feels loose and quick. The
            cost only shows up when you stop typing. That&apos;s when you realize you can&apos;t
            account for half of what you produced.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The hidden costs</h2>
          <p className="public-text">
            <strong>Mental ownership erodes.</strong> When you didn&apos;t type the bytes, they
            don&apos;t live in your head the same way. You know the AI built a feature. You
            don&apos;t fully remember what&apos;s in it.
          </p>
          <p className="public-text">
            <strong>Your git log becomes static.</strong> Auto-generated commit messages like{" "}
            <code className="inline-code">wip</code>, <code className="inline-code">fix</code>, and{" "}
            <code className="inline-code">update X</code> don&apos;t tell you what happened. A
            normal week now produces fifty illegible commits per day. You can&apos;t read your own
            history.
          </p>
          <p className="public-text">
            <strong>Monday-morning amnesia.</strong> You sit down to keep building and you
            can&apos;t remember what state the codebase was in when you left Friday. You spend the
            first hour of your week reading your own diffs to onboard yourself.
          </p>
          <p className="public-text">
            <strong>Standup paralysis.</strong> Your team asks what you&apos;ve been working on. You
            actually have to think about it. The honest answer (&ldquo;I don&apos;t really
            remember&rdquo;) feels bad to say, so you make something up.
          </p>
          <p className="public-text">
            <strong>You can&apos;t onboard yourself.</strong> The codebase grew faster than your
            mental model of it. You become a stranger in a project you wrote.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Why current tools don&apos;t fix it</h2>
          <p className="public-text">
            <code className="inline-code">git log</code> is unreadable at this volume. The format
            was designed for slow, deliberate commits. We&apos;re producing fifty a day.
          </p>
          <p className="public-text">
            Linear and Jira track plans. They have no way to see what the AI actually shipped, only
            what you intended to ship. The gap between those two has gotten really wide.
          </p>
          <p className="public-text">
            &ldquo;Just ask the AI to summarize.&rdquo; But the AI doesn&apos;t see your commits.
            You&apos;d have to paste diffs in by hand every day. Nobody does that.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The thesis</h2>
          <p className="public-text">Vibe coding needs vibe digesting.</p>
          <p className="public-text">
            If AI helped you write the code, AI should help you remember it. A daily summary in
            plain English. Not file paths. Not a reformatted git log. A real read of what happened,
            the way you&apos;d want a coworker to brief you back: Vibe Check, what shipped, what
            changed, what kept shifting, where you left off.
          </p>
          <p className="public-text">
            That&apos;s AskScout. Sign in to the web app at{" "}
            <Link href="/">askscout.dev</Link>, or run it as a CLI in any local repo with your
            own LLM key. It reads your repo, sends only the diffs to the LLM you choose, and
            writes you a digest worth reading. Free. Sets up in about ten seconds.
          </p>
        </section>

        <section className="public-section article-close">
          <p className="public-text">
            <strong>If AI helped you write the code, AI should help you remember it.</strong>
          </p>
        </section>

        <ArticleFAQ items={FAQ_PLAIN} />
      </article>

      <ReadyCTA />
      <SiteFooter />
    </main>
  );
}
