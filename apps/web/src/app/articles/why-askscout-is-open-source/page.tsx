import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Why we made AskScout open source | AskScout",
  description:
    "Why AskScout is MIT licensed: trust matters more than moat for a tool that reads your code. Plus the BYOK story for the CLI.",
  openGraph: {
    title: "Why we made AskScout open source",
    description:
      "Trust matters more than moat for a tool that reads your code. Why AskScout is fully MIT.",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Why we made AskScout open source",
    description:
      "Trust matters more than moat for a tool that reads your code.",
  },
};

const FAQ_PLAIN: { q: string; a: string }[] = [
  {
    q: "Is AskScout really fully open source?",
    a: "Yes. The web app, the CLI, and the shared core library are all public on GitHub under the MIT license. Every line, including the LLM prompt, is auditable. Nothing is closed-source or hidden behind a server-only fork.",
  },
  {
    q: "What license is AskScout under?",
    a: "MIT. You can read, fork, modify, redistribute, and build commercial products on top of AskScout with no restrictions beyond preserving the copyright notice. Same license used by most modern developer tools.",
  },
  {
    q: "Can I self-host AskScout?",
    a: "Yes. The CLI runs entirely on your machine by design, so it's already self-hosted. The web app can be deployed to your own infrastructure since the code is public, though we maintain the hosted version at askscout.dev as the easiest path for most users.",
  },
  {
    q: "How does AskScout make money?",
    a: "Right now it does not. The CLI is free open source software with you bringing your own LLM API key. The web app is free with a soft cap of 30 digests per day. We're focused on building the right product. A paid tier might come later for teams or higher limits, but the core will always be free.",
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

export default function WhyAskScoutOpenSourcePage() {
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
        <h1 className="page-title page-title--article">Why we made AskScout open source</h1>
        <p className="article-deck">
          Trust matters more than moat for a tool that reads your code. Why AskScout is fully MIT,
          including the prompt.
        </p>

        <section className="public-section">
          <h2 className="public-section-title">TLDR</h2>
          <p className="public-text">
            AskScout is MIT licensed because trust matters more than moat for a tool that reads
            your code. Every line is on GitHub, including the LLM prompt and the way we handle
            your data. The CLI uses your own API key, so on the local surface your data never
            touches our servers. Open source is the baseline, not a marketing feature.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The problem with closed-source AI tools that read your code</h2>
          <p className="public-text">
            Most of the AI tooling shipping right now is closed source. The code that decides
            what data leaves your machine, what gets sent to an LLM, what gets logged, what gets
            stored, all of that lives behind a binary you can&apos;t inspect.
          </p>
          <p className="public-text">
            For a code editor or a chat assistant, that is a tradeoff people have decided they
            can live with. For a tool that reads your repository, it is a harder ask. You are
            not just trusting the model. You are trusting whatever pipeline gets your diffs to
            the model.
          </p>
          <p className="public-text">
            We didn&apos;t want to ask anyone to take that on faith.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Open source as the baseline</h2>
          <p className="public-text">
            From day one, the assumption was that AskScout would be open source. Not as a
            growth tactic. As the only honest way to ship a tool in this category.
          </p>
          <p className="public-text">
            The whole codebase is public at{" "}
            <a
              href="https://github.com/charleshonig5/askscout"
              target="_blank"
              rel="noopener noreferrer"
              className="home-prose-link"
            >
              github.com/charleshonig5/askscout
            </a>
            . The web app, the CLI, the shared core library, the LLM prompt that decides what
            the digest sounds like, all of it. If you want to see what gets sent to your LLM
            provider, the call sites are right there in the repo. If you want to fork it and run
            your own version, MIT lets you do that with no restrictions.
          </p>
          <p className="public-text">
            We thought about a stricter license. Permissive open source can be copied by larger
            companies. We decided we cared more about being trusted than about being protected.
            For a tool whose entire job is to read your repo, that felt like the only option.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">BYOK on the CLI: control over data</h2>
          <p className="public-text">
            The CLI takes the trust story one layer further. You bring your own LLM API key.
            That means your diffs go from your machine straight to your chosen provider. No
            proxy. No middleman. No AskScout server in the path.
          </p>
          <p className="public-text">
            The CLI stores nothing online. Your config (with the key at{" "}
            <code className="inline-code">chmod 600</code> in your home folder) and per-project
            state file live on disk only. There is no telemetry, no analytics, no opt-out flag
            because there is nothing to opt out of.
          </p>
          <p className="public-text">
            For developers who care about where their code goes, the CLI is the version we
            recommend. The hosted web app is faster to start with, but the CLI is the version
            that proves the trust story.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What this means for users</h2>
          <p className="public-text">
            You do not have to take any of this on faith. You can{" "}
            <a
              href="https://github.com/charleshonig5/askscout"
              target="_blank"
              rel="noopener noreferrer"
              className="home-prose-link"
            >
              read the source code
            </a>
            . You can audit the network calls. You can verify that the only egress from the CLI
            is to the LLM provider you configured. Whatever we say about privacy, you can check.
          </p>
          <p className="public-text">
            That is the version of trust we wanted to ship. Not a privacy policy you have to
            believe. A codebase you can verify.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What it means for our business</h2>
          <p className="public-text">
            We don&apos;t pretend to have a perfect answer here. Open source under MIT means
            anyone can take the code and run with it. We accept that. The bet is that being the
            most trusted version of this tool is worth more than being the only version of it.
          </p>
          <p className="public-text">
            If a company forks AskScout and ships a paid product on top, that is fine. We&apos;d
            rather have an honest open codebase than a moat that depends on developers not
            being able to look inside.
          </p>
          <p className="public-text">
            (For the longer argument about why a tool like this needs to exist at all,{" "}
            <Link
              href="/articles/the-hidden-cost-of-vibe-coding"
              className="home-prose-link"
            >
              The Hidden Cost of Vibe Coding
            </Link>{" "}
            covers the why.)
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
