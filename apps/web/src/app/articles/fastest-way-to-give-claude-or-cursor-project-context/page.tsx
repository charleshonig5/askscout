import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title:
    "The fastest way to bring Claude or Cursor up to speed on your project | AskScout",
  description:
    "How to give Claude Code or Cursor a one-shot context block covering tech stack, recent work, current focus, and key files, so the AI is useful from the first message.",
  openGraph: {
    title: "The fastest way to bring Claude or Cursor up to speed on your project",
    description:
      "How to give Claude Code or Cursor a one-shot context block so the AI is useful from the first message.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "The fastest way to bring Claude or Cursor up to speed on your project",
    description:
      "How to give Claude Code or Cursor instant project context.",
  },
};

const FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "How do you give Claude Code project context?",
    a: "Paste a structured block at the start of a session covering tech stack, recent work, current focus, key files, and any warnings. Claude Code uses that to ground its first responses, then reads the actual files as it works. You can write this block by hand or generate it from your git history with AskScout's --resume command.",
  },
  {
    q: "What is the best prompt to start a Cursor session?",
    a: "Cursor benefits most from project-level context that names recent work and the current focus. A good starter prompt is a one-paragraph summary of the project plus what you're trying to do this session. AskScout's --resume generates this from real commits, so the context reflects what your codebase actually looks like, not an outdated description.",
  },
  {
    q: "Does Claude Code remember my project between sessions?",
    a: "Not by default. Each Claude Code session starts fresh, so anything you explained yesterday has to be re-established today. The fix is a context block you paste at the start of each session. AskScout's --resume keeps that block up to date by regenerating it from your latest git history.",
  },
  {
    q: "How often should I refresh my AI's project context?",
    a: "At the start of any new session, or after a meaningful chunk of work has landed. The point is that the context reflects the current state of the codebase. Daily is plenty for most solo developers. AskScout regenerates the --resume block on demand, so refreshing is one command.",
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

export default function FastestWayToContextPage() {
  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <nav className="home-nav" aria-label="Site">
        <Link href="/" className="home-nav-logo">
          AskScout
        </Link>
        <div className="home-nav-links">
          <Link href="/articles">Articles</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/privacy">Privacy</Link>
          <ThemeToggle />
        </div>
      </nav>

      <article className="page-body page-body--reading article">
        <Link href="/articles" className="article-back-link">
          ← All articles
        </Link>
        <h1 className="page-title page-title--article">
          The fastest way to bring Claude or Cursor up to speed on your project
        </h1>
        <p className="article-deck">
          A practical guide to giving AI coding tools project context that actually works,
          without re-explaining your codebase every session.
        </p>

        <section className="public-section">
          <h2 className="public-section-title">TLDR</h2>
          <p className="public-text">
            Claude Code and Cursor work best when they understand your project. The fastest way
            to give them context is to paste a structured block at the start of a session
            covering tech stack, recent work, current focus, key files, and any warnings.
            AskScout&apos;s <code className="inline-code">--resume</code> command generates this
            block in one shot from your real git history. Below is what good context looks like
            and how to assemble it whether you use AskScout or not.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The catch-up problem</h2>
          <p className="public-text">
            Every Claude Code session starts cold. Cursor remembers a little more across files
            but still loses thread between long breaks. The first ten minutes of any session
            tend to look like this: you explain what the project is, what you were doing
            yesterday, and where the current work fits.
          </p>
          <p className="public-text">
            That is wasted typing. The information already exists. It is in your git history,
            your file structure, and your last few sessions of work. The only reason you are
            re-explaining is that the AI does not know how to read it without your help.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What good context actually looks like</h2>
          <p className="public-text">
            From running thousands of digest sessions, the context block that consistently
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
          <div className="resource-code-block">
            <code>
              {`Tech Stack
Next.js 15 App Router, TypeScript, Tailwind, Supabase auth.

Recent Work
Shipped the new billing flow at apps/web/src/app/billing. Added Stripe webhook handling at apps/api/src/webhooks/stripe.ts. Migrated user table indexes for the new search query.

Current Focus
Wiring the team-invitations email template. The render works; the org-name lookup is returning null on a few test cases.

Key Files
- apps/web/src/app/billing/page.tsx
- apps/api/src/webhooks/stripe.ts
- apps/web/src/lib/email/team-invite.tsx

Heads Up
useAuth was just refactored. Don't suggest changes to its session-state code without checking the new BroadcastChannel implementation.`}
            </code>
          </div>
          <p className="public-text">
            Paste this at the start of a Claude Code or Cursor session and the next response
            will be sharper than starting cold. The downside is that writing it takes a few
            minutes, and it goes stale fast.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The automated way</h2>
          <p className="public-text">
            If you already have AskScout installed, generate the same block in one command:
          </p>
          <div className="resource-code-block">
            <code>askscout --resume</code>
          </div>
          <p className="public-text">
            AskScout reads your recent git history (commits, diffs, file paths), runs it
            through the same LLM you configured for digests, and produces a context block in
            exactly the format above. Tech stack inferred from your files. Recent work pulled
            from your real commits. Current focus inferred from the most recent activity. Key
            files surfaced from the most-touched paths. Warnings extracted from churn data.
          </p>
          <p className="public-text">
            Pipe it straight into your clipboard:
          </p>
          <div className="resource-code-block">
            <code>askscout --resume | pbcopy   # macOS</code>
          </div>
          <div className="resource-code-block">
            <code>askscout --resume | xclip    # Linux</code>
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
            to run on demand (the same 10-second budget as a regular digest).
          </p>
          <p className="public-text">
            For most solo developers the rhythm that works is: regenerate at the top of every
            new Claude Code or Cursor session. If you stay in the same session all day, the
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
            with a real context block, going back to cold sessions feels noticeably worse. (If
            you want the broader picture of where AI coding tools fit,{" "}
            <Link
              href="/articles/best-ai-coding-tools-for-solo-developers"
              className="home-prose-link"
            >
              here&apos;s an honest read on Cursor, Claude Code, Copilot, and Aider
            </Link>
            .)
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">FAQ</h2>
          <div className="faq-list">
            {FAQ_PLAIN.map((item) => (
              <div key={item.q} className="faq-item">
                <h3 className="faq-question">{item.q}</h3>
                <p className="public-text">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="public-section">
          <div className="article-cta">
            <Link href="/" className="btn btn-primary">
              Try AskScout
            </Link>
            <Link href="/docs" className="article-cta-secondary">
              Or read the docs →
            </Link>
          </div>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
