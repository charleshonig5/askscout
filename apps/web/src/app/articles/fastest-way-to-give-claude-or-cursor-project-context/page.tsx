import Link from "next/link";
import { CommandChip } from "@/components/CommandChip";
import { MarketingNav } from "@/components/MarketingNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ArticleHero } from "@/components/ArticleHero";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import { ReadyCTA } from "@/components/ReadyCTA";
import { articleJsonLd, articleBreadcrumbJsonLd } from "@/lib/article-jsonld";

export const metadata = {
  // SERP-friendly title (~60 chars). Body H1 stays long-form for
  // in-page voice; metadata title is shorter and keeps the three
  // brand names visible in Google's snippet without truncating.
  // Brand suffix dropped — "askScout" already appears in the H1
  // and the breadcrumb chrome.
  title: "Give Claude Code, Cursor, or Codex project context fast",
  description:
    "How to give Claude Code, Cursor, or Codex a one-shot context block covering tech stack, recent work, current focus, and key files, so the AI is useful from the first message.",
  alternates: {
    canonical: "/articles/fastest-way-to-give-claude-or-cursor-project-context",
  },
  openGraph: {
    title: "The fastest way to bring Claude Code, Cursor, or Codex up to speed on your project",
    description:
      "How to give Claude Code, Cursor, or Codex a one-shot context block so the AI is useful from the first message.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The fastest way to bring Claude Code, Cursor, or Codex up to speed on your project",
    description:
      "How to give Claude Code, Cursor, or Codex instant project context.",
  },
};

const FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "How do you give Claude Code project context?",
    a: "Paste a structured block at the start of a session covering tech stack, recent work, current focus, key files, and any warnings. Claude Code uses that to ground its first responses, then reads the actual files as it works. You can write this block by hand or generate it from your git history with askScout's --resume command.",
  },
  {
    q: "What is the best prompt to start a Cursor session?",
    a: "Cursor benefits most from project-level context that names recent work and the current focus. A good starter prompt is a one-paragraph summary of the project plus what you're trying to do this session. askScout's --resume generates this from real commits, so the context reflects what your codebase actually looks like, not an outdated description.",
  },
  {
    q: "Does Claude Code remember my project between sessions?",
    a: "Not by default. Each Claude Code session starts fresh, so anything you explained yesterday has to be re-established today. The fix is a context block you paste at the start of each session. askScout's --resume keeps that block up to date by regenerating it from your latest git history.",
  },
  {
    q: "How often should I refresh my AI's project context?",
    a: "At the start of any new session, or after a meaningful chunk of work has landed. The point is that the context reflects the current state of the codebase. Daily is plenty for most solo developers. askScout regenerates the --resume block on demand, so refreshing is one command.",
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
  slug: "fastest-way-to-give-claude-or-cursor-project-context",
  headline:
    "The fastest way to bring Claude Code, Cursor, or Codex up to speed on your project",
  description:
    "How to give Claude Code, Cursor, or Codex a one-shot context block covering tech stack, recent work, current focus, and key files, so the AI is useful from the first message.",
});

const BREADCRUMB_SCHEMA = articleBreadcrumbJsonLd({
  slug: "fastest-way-to-give-claude-or-cursor-project-context",
  title: "The fastest way to bring Claude Code, Cursor, or Codex up to speed on your project",
});

export default function FastestWayToContextPage() {
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
        slug="fastest-way-to-give-claude-or-cursor-project-context"
        title="The fastest way to bring Claude Code, Cursor, or Codex up to speed on your project"
        deck="A practical guide to giving AI coding tools project context that actually works, without re-explaining your codebase every session."
      />

      <article className="page-body page-body--reading article article--has-hero">
        <p className="public-text article-tldr">
          <strong>TLDR:</strong> Claude Code, Cursor, and Codex work best when they understand
          your project. The fastest way to give them context is to paste a structured block at
          the start of a session covering tech stack, recent work, current focus, key files,
          and any warnings. The askScout web app has an <strong>AI Resume Prompt</strong> button
          that assembles this block from your latest digest. The CLI does the same thing with{" "}
          <code className="inline-code">askscout --resume</code>. Below is what good context
          looks like and how to assemble it whether you use askScout or not.
        </p>

        <section className="public-section">
          <h2 className="public-section-title">The catch-up problem</h2>
          <p className="public-text">
            Every{" "}
            <a
              href="https://docs.claude.com/en/docs/claude-code/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="home-prose-link"
            >
              Claude Code
            </a>{" "}
            or Codex session starts cold. Cursor remembers a little more across files but still
            loses thread between long breaks. The first ten minutes of any session tend to look
            the same: you explain the project and what you&apos;re doing right now.
          </p>
          <p className="public-text">
            That is wasted typing. The information already exists in your git history and your
            recent sessions of work. The only reason you are re-explaining is that the AI
            doesn&apos;t know how to read it without your help.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What good context actually looks like</h2>
          <p className="public-text">
            After working this pattern into real repos, the context block that consistently
            produces useful first responses has five parts.
          </p>
          <p className="public-text">
            <strong>Tech stack.</strong> A one-line summary of the languages, frameworks, and
            major libraries. The AI uses this to know which idioms to reach for.
          </p>
          <p className="public-text">
            <strong>Recent work.</strong> Two or three sentences describing what shipped in the
            last few days, with file paths. This anchors the model to the current state of the
            code, not an outdated mental model.
          </p>
          <p className="public-text">
            <strong>Current focus.</strong> What you&apos;re actively working on this session.
            One sentence. Tells the AI what is in scope and what is not.
          </p>
          <p className="public-text">
            <strong>Key files.</strong> A list of file paths that matter for the current work.
            Helps the AI prioritize which files to read first.
          </p>
          <p className="public-text">
            <strong>Warnings.</strong> Anything brittle, in flight, or recently broken. Saves
            the AI from suggesting changes to code that is already mid-refactor.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The manual way</h2>
          <p className="public-text">
            You can write this block by hand. The format that works:
          </p>
          {/* <pre> preserves the multi-line structure so the
              5-section format renders as it actually appears, not
              as a collapsed paragraph. See the matching change in
              how-askscout-summarizes-git's before/after section. */}
          <pre className="resource-code-block">
{`Tech Stack
Next.js 15 App Router, TypeScript, Tailwind, Supabase auth.

Recent Work
Shipped the new billing flow at apps/web/src/app/billing. Added Stripe webhook handling at apps/api/src/webhooks/stripe.ts. Migrated user table indexes for the new search query.

Current Focus
Wiring the team-invitations email template. The render works. The org-name lookup is returning null on a few test cases.

Key Files
- apps/web/src/app/billing/page.tsx
- apps/api/src/webhooks/stripe.ts
- apps/web/src/lib/email/team-invite.tsx

Heads Up
useAuth was just refactored. Don't suggest changes to its session-state code without checking the new BroadcastChannel implementation.`}
          </pre>
          <p className="public-text">
            Paste this at the start of a Claude Code, Cursor, or Codex session and the next response
            will be sharper than starting cold. The downside is that writing it takes a few
            minutes, and it goes stale fast.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The automated way</h2>
          <p className="public-text">
            On the{" "}
            <Link href="/dashboard" className="home-prose-link">
              askScout web app
            </Link>
            , generate this block by clicking the{" "}
            <strong>AI Resume Prompt</strong> button at the bottom of any digest. It opens a
            modal with the same five-section context, ready to copy. The CLI does the same
            thing in one command (install steps are in the{" "}
            <Link href="/docs" className="home-prose-link">CLI docs</Link>):
          </p>
          {/* CommandChip is the existing site pattern for
              copy-on-click shell commands ($ prefix + Copy → Check
              icon swap, inline-flex chip that hugs the command).
              Replaces the prior wide <pre> block that filled the
              article column without giving the user an obvious
              click-to-copy affordance. .article-command-row wraps
              the chip in a block container so it gets paragraph-
              level vertical spacing in article flow. */}
          <div className="article-command-row">
            <CommandChip command="askscout --resume" />
          </div>
          <p className="public-text">
            askScout reads your recent git history (commits, diffs, file paths), runs it
            through the same LLM you configured for digests, and produces a context block in
            exactly the format above. Every section is grounded in your real activity, not a
            stale description of the project. (For the full pipeline this builds on, see{" "}
            <Link
              href="/articles/how-askscout-summarizes-git"
              className="home-prose-link"
            >
              How askScout turns a noisy git log into a 10-second digest
            </Link>
            .)
          </p>
          <p className="public-text">
            Pipe it straight into your clipboard (macOS):
          </p>
          <div className="article-command-row">
            <CommandChip command="askscout --resume | pbcopy" />
          </div>
          <p className="public-text">
            Or on Linux:
          </p>
          <div className="article-command-row">
            <CommandChip command="askscout --resume | xclip" />
          </div>
          <p className="public-text">
            Then paste at the start of any AI coding session.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">When to refresh</h2>
          <p className="public-text">
            The block goes stale as you ship. The fix is to regenerate it whenever you start a
            new session. <code className="inline-code">askscout --resume</code> is fast enough
            to run on demand (well under a minute, same as a regular digest).
          </p>
          <p className="public-text">
            For most solo developers the rhythm that works is: regenerate at the top of every
            new Claude Code, Cursor, or Codex session. If you stay in the same session all day, the
            initial paste is fine. The point is that the context the AI sees should reflect
            what your codebase actually looks like right now, not what you remember it being.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Why this matters</h2>
          <p className="public-text">
            The quality of any AI coding session is set by the first message. A cold session
            with no context produces generic suggestions. A session that opens with real
            project context produces suggestions grounded in your actual code.
          </p>
          <p className="public-text">
            The difference is bigger than most developers expect. Once you start every session
            with a real context block, going back to cold sessions feels noticeably worse. (For
            the broader picture of where AI coding tools fit,{" "}
            <Link
              href="/articles/best-ai-coding-tools-for-solo-developers"
              className="home-prose-link"
            >
              here&apos;s an honest read on Claude Code, Cursor, Codex, and the other AI
              coding tools
            </Link>
            . For the origin story of askScout itself,{" "}
            <Link
              href="/articles/introducing-askscout"
              className="home-prose-link"
            >
              Introducing askScout
            </Link>{" "}
            sets the table.)
          </p>
        </section>

        <ArticleFAQ items={FAQ_PLAIN} />
      </article>

      <ReadyCTA />
      <SiteFooter />
    </main>
  );
}
