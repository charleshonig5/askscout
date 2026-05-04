import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Introducing AskScout: your vibe coding companion | AskScout",
  description:
    "AskScout reads your repo and writes you a daily digest of what you shipped. The companion tool for developers using Claude Code, Cursor, and Codex.",
  openGraph: {
    title: "Introducing AskScout: your vibe coding companion",
    description:
      "The companion tool for developers using Claude Code, Cursor, and Codex. Reads your repo, writes your digest.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Introducing AskScout: your vibe coding companion",
    description:
      "AskScout reads your repo and writes you a daily digest of what you shipped.",
  },
};

const FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "What is a vibe coding companion?",
    a: "A vibe coding companion is a tool that supports the way most developers code now: describe what you want, accept AI patches, ship volume. AskScout reads what you actually shipped each day and summarizes it in plain English so you can keep up with your own repo.",
  },
  {
    q: "Is AskScout free to use?",
    a: "Yes. The web app is free with a soft cap of 30 digests per day. The CLI is free open-source software under MIT, with you bringing your own LLM API key (about $0.001 to $0.003 per digest). No paid tier, no upsell.",
  },
  {
    q: "Does AskScout work with Claude Code, Cursor, and Codex?",
    a: "Yes. AskScout does not replace Claude Code, Cursor, or Codex. It runs after them. They write code; AskScout reads what you wrote and produces a daily digest. Most users run one of the AI coding tools all day and read AskScout once at the end.",
  },
  {
    q: "How is AskScout different from Claude Code, Cursor, or Codex?",
    a: "Those tools write code. AskScout does not write code at all. It reads your git history (commits and diffs) and writes a plain-English summary of what shipped, what changed, and what you left off. Different layer, different job.",
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

export default function IntroducingAskScoutPage() {
  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
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

      <article className="page-body page-body--reading article">
        <Link href="/articles" className="article-back-link">
          ← All articles
        </Link>
        <h1 className="page-title page-title--article">
          Introducing AskScout: your vibe coding companion
        </h1>
        <p className="article-deck">
          AskScout reads your repo and writes you a daily digest of what you shipped. The
          companion tool for developers using Claude Code, Cursor, and Codex.
        </p>

        <section className="public-section">
          <h2 className="public-section-title">TLDR</h2>
          <p className="public-text">
            AskScout is a daily digest tool for developers who code with AI assistance. Claude
            Code, Cursor, and Codex help you write code. AskScout reads what you wrote and
            writes you back a 10-second summary covering what shipped, what changed, what kept
            getting reworked, and what you left off. The web app runs in your browser, signed
            in with GitHub. The CLI runs in any local git repo with your own LLM key. Both are
            free, both are open source.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The problem AI coding tools created</h2>
          <p className="public-text">
            Two years ago a productive developer wrote ten commits a day. Today the same person
            ships fifty. The AI tools made the typing fast. They did not make the
            remembering fast.
          </p>
          <p className="public-text">
            Friday afternoon you close your laptop and you cannot account for half of what your
            repo does. Your git log is illegible. Your standup is a guess. Monday morning you
            spend an hour reading your own diffs to onboard yourself. (We wrote about this in{" "}
            <Link
              href="/articles/the-hidden-cost-of-vibe-coding"
              className="home-prose-link"
            >
              The Hidden Cost of Vibe Coding
            </Link>
            .)
          </p>
          <p className="public-text">
            AskScout exists because that gap kept getting wider, and nothing in the existing
            tooling closed it.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What AskScout actually does</h2>
          <p className="public-text">
            Run AskScout in any git repo and it reads your commits and diffs since your last
            run. It groups what it finds into four sections: Shipped (things that went from not
            existing to working), Changed (things that already existed and got modified), Still
            Shifting (areas reworked 3+ times in the window), and Left Off (anything in
            progress when work stopped).
          </p>
          <p className="public-text">
            Then it adds two computed signals: Codebase Health (Growth, Focus, Churn) and Pace
            Check (today versus your recent average). Both come from raw git data, not the LLM.
          </p>
          <p className="public-text">
            The whole digest is short enough to read in 10 seconds. That is the constraint we
            built around. If it takes longer than that to read, you will skip it.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Two surfaces, one product</h2>
          <p className="public-text">
            AskScout runs in two places. The web app at askscout.dev signs in with GitHub, picks
            a repo, and starts streaming. Your digest history saves under your account. The CLI
            installs with <code className="inline-code">npm install -g askscout</code>, lives
            in any local repo, and uses your own Anthropic or OpenAI API key.
          </p>
          <p className="public-text">
            Same digest format, different fits. Web is for hosted history and instant setup. CLI
            is for local-only workflows, CI integration, and developers who want full control of
            their data.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What it is not</h2>
          <p className="public-text">
            AskScout is not a code generator. It will not write your features, refactor your
            modules, or autocomplete your typing. Claude Code, Cursor, Codex, GitHub Copilot,
            and Aider already do that, and they do it well.
          </p>
          <p className="public-text">
            AskScout sits one layer above those tools. They write code. AskScout reads what you
            wrote. The two are companions, not competitors.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Try it</h2>
          <p className="public-text">
            The web app takes about ten seconds: sign in with GitHub, pick a repo, watch the
            first digest stream in. The CLI takes about a minute: install, paste your API key,
            run <code className="inline-code">askscout</code> in any git repo.
          </p>
          <p className="public-text">
            Both surfaces are free. The CLI is open source under MIT. We hope this becomes the
            default companion next to whatever AI coding tool you already use.
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
