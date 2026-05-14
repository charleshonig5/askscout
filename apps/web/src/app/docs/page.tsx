import Link from "next/link";
import { SquareArrowUpRight } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { InstallChip } from "@/components/InstallChip";
import { CommandChip } from "@/components/CommandChip";
import DocsFAQ from "@/components/DocsFAQ";
import { SiteFooter } from "@/components/SiteFooter";
import { DOCS_FAQ_PLAIN } from "@/lib/docs-faq-data";

export const metadata = {
  title: "Docs | AskScout",
  description:
    "AskScout docs. How to use the web app, the CLI, and answers to common questions.",
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: DOCS_FAQ_PLAIN.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function DocsPage() {
  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <MarketingNav />

      {/* ===========================================================
          DOCS HERO — Figma 244:3018. Pridi 52 title + last-updated
          date as a stacked head, then a 20px body deck with a
          "View on GitHub" link below.
          =========================================================== */}
      <section className="docs-hero">
        <div className="docs-hero-inner">
          <div className="docs-hero-headblock">
            <h1 className="docs-hero-title">AskScout documentation</h1>
            <p className="docs-hero-updated">Last updated May 4, 2026</p>
          </div>
          <div className="docs-hero-body">
            <p className="docs-hero-deck">
              AskScout is an open source daily digest tool for developers and
              vibe coders. It reads your git activity and writes a digestible,
              plain-English summary of what you worked on each day. Use the
              web app or run the CLI locally on your device.
            </p>
            <a
              href="https://github.com/charleshonig5/askscout"
              target="_blank"
              rel="noopener noreferrer"
              className="docs-hero-github"
            >
              <span>View on GitHub</span>
              <SquareArrowUpRight size={16} strokeWidth={1.5} aria-hidden />
            </a>
          </div>
        </div>
      </section>

      <div className="page-body">
        {/* WEB */}
        <section className="public-section">
          <h2 className="public-section-title">Web app</h2>
          <p className="public-text">
            Run AskScout in your browser, no install required. Sign in with GitHub and get your
            first digest immediately.
          </p>

          <h3 className="public-card-title" style={{ marginTop: 16 }}>Getting started</h3>
          <p className="public-text">
            Open <Link href="/" className="home-prose-link">askscout.dev</Link> and sign in with
            your GitHub account. Your account is created on the spot, and your first digest
            starts streaming automatically once you pick a repo. There is no setup step and no
            key to manage. You can revoke GitHub access any time at{" "}
            <a
              href="https://github.com/settings/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="home-prose-link"
            >
              github.com/settings/applications
            </a>
            .
          </p>
        </section>

        {/* CLI */}
        <section className="public-section">
          <h2 className="public-section-title">CLI</h2>
          <p className="public-text">
            Run AskScout entirely on your machine, with your own LLM key. Works in any local git
            repo, including private ones and self-hosted git.
          </p>

          <h3 className="public-card-title" style={{ marginTop: 16 }}>Getting started</h3>
          <p className="public-text">
            Copy the command below into your terminal to install AskScout globally:
          </p>
          <div style={{ margin: "12px 0" }}>
            <InstallChip />
          </div>

          <h3 className="public-card-title" style={{ marginTop: 24 }}>Setup</h3>
          <p className="public-text">
            Run setup once to save your Anthropic or OpenAI API key locally. The key stays on
            your machine and never goes anywhere except the LLM provider you configured.
          </p>
          <div style={{ margin: "12px 0" }}>
            <CommandChip command="askscout --setup" />
          </div>

          <h3 className="public-card-title" style={{ marginTop: 24 }}>Run your first digest</h3>
          <p className="public-text">
            Run AskScout in any git repo. Your first digest covers today, and every run after
            picks up from there.
          </p>
          <div style={{ margin: "12px 0" }}>
            <CommandChip command="askscout" />
          </div>

          <h3 className="public-card-title" style={{ marginTop: 24 }}>Commands</h3>
          <p className="public-text">
            Every command AskScout supports, with a quick note on when to use each one.
          </p>
          <div className="resource-commands">
            <div className="resource-command">
              <CommandChip command="askscout" />
              <span className="resource-command-desc">
                Generate a daily digest of what changed since your last run.
              </span>
            </div>
            <div className="resource-command">
              <CommandChip command="askscout --week" />
              <span className="resource-command-desc">
                Generate a digest covering the past 7 days. Good for Friday wrap-ups or catching
                up after time off.
              </span>
            </div>
            <div className="resource-command">
              <CommandChip command="askscout --standup" />
              <span className="resource-command-desc">
                Format your digest as a Slack-ready standup with Done, Up Next, and Heads Up
                sections.
              </span>
            </div>
            <div className="resource-command">
              <CommandChip command="askscout --resume" />
              <span className="resource-command-desc">
                Generate a context block (tech stack, recent work, current focus, key files) for
                Claude, Cursor, or Copilot. Lets the AI pick up your project on a new session
                without you explaining it.
              </span>
            </div>
            <div className="resource-command">
              <CommandChip command="askscout --json" />
              <span className="resource-command-desc">
                Output the digest as machine-readable JSON. Useful for scripts, dashboards, or CI.
              </span>
            </div>
            <div className="resource-command">
              <CommandChip command="askscout --setup" />
              <span className="resource-command-desc">
                Save or replace your API key. Cannot be combined with other options.
              </span>
            </div>
            <div className="resource-command">
              <CommandChip command="askscout --dry-run" />
              <span className="resource-command-desc">
                Preview which commits AskScout would include, without calling the LLM. No cost
                and nothing gets saved.
              </span>
            </div>
          </div>
          <p className="public-text">
            <code className="inline-code">--standup</code> and{" "}
            <code className="inline-code">--resume</code> cannot be combined.{" "}
            <code className="inline-code">--setup</code> ignores all other options.
          </p>

          <h3 className="public-card-title" style={{ marginTop: 24 }}>Advanced configuration</h3>
          <p className="public-text">
            Reference for power users. Setup handles the basics. This section is for tweaks
            like overriding the default model, which require editing the config file directly.
          </p>
          <p className="public-text">
            Your API key lives at <code className="inline-code">~/.askscout/config.json</code>{" "}
            with <code className="inline-code">chmod 600</code> (owner read/write only). The
            file is JSON shaped like this (the comment below is illustrative, not valid JSON):
          </p>
          <div className="resource-code-block">
            <code>
              {`{
  "provider": "anthropic" | "openai",
  "apiKey": "sk-...",
  "model": "claude-haiku-4-5-20250414"   // optional override
}`}
            </code>
          </div>
          <p className="public-text">
            At setup, AskScout detects the provider from your key prefix and writes it into the
            file. Keys starting with <code className="inline-code">sk-ant-</code> route to
            Anthropic. Other keys starting with <code className="inline-code">sk-</code> route
            to OpenAI. Any other format is rejected. After setup, the stored provider value is
            used directly without re-detecting on each run.
          </p>
          <p className="public-text">
            Default models:{" "}
            <code className="inline-code">claude-haiku-4-5-20250414</code> for Anthropic and{" "}
            <code className="inline-code">gpt-4o-mini</code> for OpenAI. Cost runs roughly $0.001
            to $0.003 per digest at the defaults. Override by adding a{" "}
            <code className="inline-code">model</code> field to the config file. The model has
            to belong to the same provider as your key.
          </p>
          <p className="public-text">
            Each repo also gets a small{" "}
            <code className="inline-code">.askscout/state.json</code> in the project root. It
            stores the last run timestamp, run count, a rolling history of up to your last 10
            digest runs, and a 200-word AI-maintained summary of the project that feeds back
            into the next run. Pace Check uses the most recent 3 entries from that history as
            its baseline; the older entries are kept for context but not currently consumed.
            Add the folder to your <code className="inline-code">.gitignore</code> if you want
            to keep it out of version control.
          </p>
        </section>

        {/* FAQ */}
        <section className="public-section">
          <h2 className="public-section-title">FAQ</h2>
          <p className="public-text">
            For product-level questions (privacy, pricing, what AskScout reads),{" "}
            <Link href="/" className="home-prose-link">see the homepage FAQ</Link>. The questions
            below are docs-specific.
          </p>
          <DocsFAQ />
          <p className="public-text" style={{ marginTop: 24 }}>
            Found a bug or want to request a feature? Open an issue at{" "}
            <a
              href="https://github.com/charleshonig5/askscout/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="home-prose-link"
            >
              github.com/charleshonig5/askscout/issues
            </a>
            . Include your AskScout version, OS, and the command you ran.
          </p>
        </section>

        <div className="public-cta">
          <Link href="/" className="btn btn-primary" style={{ fontSize: 15, padding: "10px 24px" }}>
            Try AskScout
          </Link>
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
