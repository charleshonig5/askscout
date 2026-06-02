import Link from "next/link";
import { MarketingNav } from "@/components/MarketingNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ArticleHero } from "@/components/ArticleHero";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { ReadyCTA } from "@/components/ReadyCTA";
import { articleJsonLd, articleBreadcrumbJsonLd } from "@/lib/article-jsonld";

export const metadata = {
  // Brand suffix dropped — "askScout" already appears in the
  // headline, so " | askScout" was redundant + ate SERP chars.
  title: "How askScout turns a noisy git log into a 10-second digest",
  description:
    "A walkthrough of how askScout reads commits and diffs, computes structural signals, and uses a tuned LLM prompt to produce a readable digest.",
  alternates: {
    canonical: "/articles/how-askscout-summarizes-git",
  },
  openGraph: {
    title: "How askScout turns a noisy git log into a 10-second digest",
    description:
      "A walkthrough of how askScout reads commits and diffs, computes structural signals, and uses a tuned LLM prompt to produce a readable digest.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "How askScout turns a noisy git log into a 10-second digest",
    description:
      "A walkthrough of how askScout reads commits and diffs, computes structural signals, and uses a tuned LLM prompt to produce a readable digest.",
  },
};

const FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "How does askScout read my git history?",
    a: "On the web app, askScout pulls commits and diffs through the GitHub API after you grant read access. On the CLI, it shells out to git in your local repo to fetch the same data. The web app also reads pull request descriptions, linked issue bodies, ~15 lines of source code around each changed hunk (capped at 8 files per digest), and the repo's README plus one package manifest like package.json. Those extras ground the digest in the project's actual intent and context. Lock files, node_modules, environment variables, secrets, and build artifacts are never read.",
  },
  {
    q: "What LLM does askScout use?",
    a: "Defaults to Claude Haiku 4.5 on Anthropic and gpt-4o-mini on OpenAI, with the provider auto-detected from your API key prefix. You can override the model in ~/.askscout/config.json. The defaults are picked for speed and cost. Larger models work but run slower.",
  },
  {
    q: "How long does it take to generate a digest?",
    a: "Most digests stream in well under a minute end to end. The bottleneck is the LLM round trip. Reading commits and computing structural signals (Codebase Health, Pace Check) takes well under a second on typical repos.",
  },
  {
    q: "Can I see the prompt askScout uses?",
    a: "Yes. askScout is open source under MIT, so the system prompt lives at packages/core/src/summarize.ts in the public repo. You can read every editorial constraint we put on the model: the banned phrases list, the format rules, the section definitions. (See the article for the broader argument behind why prompts matter.)",
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
  slug: "how-askscout-summarizes-git",
  headline: "How askScout turns a noisy git log into a 10-second digest",
  description:
    "A walkthrough of how askScout reads commits and diffs, computes structural signals, and uses a tuned LLM prompt to produce a readable digest.",
});

const BREADCRUMB_SCHEMA = articleBreadcrumbJsonLd({
  slug: "how-askscout-summarizes-git",
  title: "How askScout turns a noisy git log into a 10-second digest",
});

export default function HowAskScoutSummarizesGitPage() {
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
        slug="how-askscout-summarizes-git"
        title="How askScout turns a noisy git log into a 10-second digest"
        deck="A walkthrough of the four steps between your messy git history and a digest you can actually read."
      />

      <article className="page-body page-body--reading article article--has-hero">
        <p className="public-text article-tldr">
          <strong>TLDR:</strong> askScout reads your commits and diffs through git, groups them into
          four sections (Shipped, Changed, Still Shifting, Left Off), computes two structural
          signals (Codebase Health, Pace Check), and feeds the whole package into a tuned LLM prompt
          that renders the result in plain English. Each step exists for a specific reason. All of
          it is open source.
        </p>

        <section className="public-section">
          <h2 className="public-section-title">Why git log fails at AI-coding pace</h2>
          <p className="public-text">
            <code className="inline-code">git log</code> works fine when you write a handful of
            clean commits a day with messages you wrote yourself. At AI-assisted pace, with
            auto-generated messages like <code className="inline-code">fix</code> and{" "}
            <code className="inline-code">wip</code>, the format stops being useful. The output
            doesn't scale to the volume.
          </p>
          <p className="public-text">
            The fix isn't a better git command. It's a layer on top of git that does what humans
            used to do at lower volume: read it and summarize it. askScout is that layer. Here's how
            it works. (For the bigger argument behind why this layer matters now,{" "}
            <Link href="/articles/introducing-askscout" className="home-prose-link">
              Introducing askScout
            </Link>{" "}
            sets the table.)
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Step 1: Read commits and diffs</h2>
          <p className="public-text">
            On the web app, askScout pulls commits and diffs through the{" "}
            <a
              href="https://docs.github.com/en/rest"
              target="_blank"
              rel="noopener noreferrer"
              className="home-prose-link"
            >
              GitHub REST API
            </a>{" "}
            after you grant read-only access. On the CLI, it calls git directly in your local repo
            to pull the same data, with <code className="inline-code">--week</code> for the past 7
            days. Either path fetches commits since your last run by default.
          </p>
          <p className="public-text">What gets read on the web app:</p>
          <ul>
            <li>Commit messages, timestamps, authors, file paths.</li>
            <li>The actual diff patches (the lines added and removed in each commit).</li>
            <li>
              Pull request titles and descriptions, plus the titles and bodies of any GitHub issues
              those PRs reference, so the digest can ground itself in the stated intent behind each
              change.
            </li>
            <li>
              For up to the 8 most-changed files, ~15 lines of surrounding source code around each
              changed hunk so refactors and sparse edits can be read in context.
            </li>
            <li>
              The repository&apos;s README and a single project manifest (one of{" "}
              <code className="inline-code">package.json</code>,{" "}
              <code className="inline-code">pyproject.toml</code>,{" "}
              <code className="inline-code">Cargo.toml</code>,{" "}
              <code className="inline-code">go.mod</code>,{" "}
              <code className="inline-code">composer.json</code>, or{" "}
              <code className="inline-code">Gemfile</code>), so the model can frame every diff
              against the actual project.
            </li>
          </ul>
          <p className="public-text">
            What doesn&apos;t get read: full source files outside the changed regions, environment
            variables, secrets, lock files, build artifacts, and untracked files. The CLI reads the
            same data minus the PR and issue context, because git itself doesn&apos;t store that.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Step 2: Compute structural signals</h2>
          <p className="public-text">
            Before any LLM gets involved, askScout computes two things from the raw data: the
            Codebase Health card and the Pace Check.
          </p>
          <p className="public-text">
            <strong>Codebase Health</strong> is three measurements. Growth is the ratio of lines
            added to lines removed, classified from Lean up through Ballooning. Focus looks at the
            average files touched per commit, running from Tight to Scattered. Churn counts how many
            files were reworked three or more times in the window, on a Clean-to-High scale. All
            three come from arithmetic, not LLM judgment.
          </p>
          <p className="public-text">
            <strong>Pace Check</strong> compares today&apos;s commit count to the average of your
            last three runs. It only renders after you have at least 3 prior digests, so the
            baseline is real. The multiplier (e.g. <em>1.7x</em>) is straight division.
          </p>
          <p className="public-text">
            Doing the math instead of asking the model makes these numbers exact and easy to audit.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Step 3: Feed real data into a tuned prompt</h2>
          <p className="public-text">
            The LLM only writes the narrative parts: Vibe Check, the bullet sections, and Key
            Takeaways. Everything structural is already done. The prompt grounds the model in the
            actual commit messages and diffs, so it cannot invent work that did not happen.
          </p>
          <p className="public-text">
            The prompt has strict editorial constraints. Banned phrases like &ldquo;great
            work&rdquo; and &ldquo;leveraged.&rdquo; A required format for bullets:{" "}
            <code className="inline-code">Title - body</code> with 2-5 plain-language words in the
            title. No file paths or function names in summaries (the model translates everything to
            features and behaviors). No em dashes, no semicolons. The full constraint list is open
            source. See{" "}
            <Link href="/articles/why-askscout-is-open-source" className="home-prose-link">
              Why we made askScout open source
            </Link>{" "}
            for why we publish it.
          </p>
          <p className="public-text">
            The point of the constraints is voice. Without them, the LLM defaults to changelog
            English: passive and vague. The constraints force it into the voice of a sharp, warm
            friend who actually looked at the code.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Step 4: Render in plain English</h2>
          <p className="public-text">
            The output gets rendered with emoji section headers (or bracketed plain text when stdout
            is piped or <code className="inline-code">NO_COLOR</code> is set). Bullets use the{" "}
            <code className="inline-code">•</code> character in rich mode and{" "}
            <code className="inline-code">-</code> in pipes. Stats lines use proper unicode
            separators.
          </p>
          <p className="public-text">
            That is everything. Read commits, compute signals, prompt the LLM with real data and
            tight constraints, render the output. The whole pipeline runs in well under a minute for
            typical repos, with most of that time spent waiting on the model. Install the CLI in
            your own repo via the{" "}
            <Link href="/docs" className="home-prose-link">
              CLI docs
            </Link>{" "}
            to watch it run end-to-end.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Before and after</h2>
          <p className="public-text">Raw git log:</p>
          {/* <pre> instead of <div> preserves the leading
              whitespace + line breaks the template literal carries,
              so the bulleted "Shipped" / "Left Off" sections in the
              askScout output don't collapse into a single run-on
              paragraph. Same change applied to the raw git log
              below for consistency, even though it's single lines. */}
          <pre className="resource-code-block">
            {`a1b2c3d wip
b4c5d6e fix
c7d8e9f update auth
d0e1f2a wip again
e3f4a5b add tests
f6a7b8c fix tests`}
          </pre>
          <p className="public-text">askScout output for the same window:</p>
          <pre className="resource-code-block">
            {`🚀  Shipped  2

  •  Auth flow lands
     Users can sign in with email + password. Sessions persist
     across reloads, and the rate-limit banner finally renders
     correctly.

  •  Test harness for auth
     Six new integration tests cover sign-in, sign-out, and
     token refresh. CI is now blocking on auth regressions.


📍  Left Off  1

  •  Edge case in token refresh
     Refresh works on long-lived sessions but throws when the
     token has been revoked server-side. Next step is wiring up
     the 401 path to a clean re-auth.`}
          </pre>
          <p className="public-text">
            Both views describe the same six commits. One is illegible at scale. The other you can
            read on your phone in a coffee line.
          </p>
        </section>

        <ArticleFAQ items={FAQ_PLAIN} />
      </article>

      <ReadyCTA />
      <SiteFooter />
    </main>
  );
}
