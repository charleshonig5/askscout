import {
  Download,
  LogIn,
  PlaySquare,
  Settings,
  ShieldCheck,
  SquareArrowUpRight,
} from "lucide-react";
import { signIn } from "@/auth";
import { MarketingNav } from "@/components/MarketingNav";
import { CommandChip } from "@/components/CommandChip";
import { DocsCliCmdInline } from "@/components/DocsCliCmdInline";
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

      {/* ===========================================================
          WEB APP — Figma 244:3035. Section heading + 2-card row.
          Lives OUTSIDE the legacy .page-body wrapper so the 1px
          top-border (section divider) can span the full viewport
          width per the standard section rhythm.
          =========================================================== */}
      <section className="docs-section docs-webapp">
        <div className="docs-webapp-inner">
          <div className="docs-section-heading">
            <h2 className="docs-section-title">Web app</h2>
            <p className="docs-section-deck">
              Run AskScout right in your browser with the app, no install
              required. Sign in with GitHub and get your first digest
              immediately.
            </p>
          </div>
          <div className="docs-webapp-cards">
            <div className="docs-webapp-card">
              <div className="docs-webapp-card-content">
                <span className="docs-webapp-card-icon" aria-hidden>
                  <LogIn size={28} strokeWidth={1.25} />
                </span>
                <div className="docs-webapp-card-text">
                  <h3 className="docs-webapp-card-title">
                    Sign in with GitHub
                  </h3>
                  <p className="docs-webapp-card-body">
                    Your account is created on the spot, and your first
                    digest starts streaming automatically.
                  </p>
                </div>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/dashboard" });
                }}
              >
                <button type="submit" className="docs-webapp-card-btn">
                  Sign in with GitHub
                </button>
              </form>
            </div>
            <div className="docs-webapp-card">
              <div className="docs-webapp-card-content">
                <span className="docs-webapp-card-icon" aria-hidden>
                  <ShieldCheck size={28} strokeWidth={1.25} />
                </span>
                <div className="docs-webapp-card-text">
                  <h3 className="docs-webapp-card-title">
                    Control your data
                  </h3>
                  <p className="docs-webapp-card-body">
                    There is no setup step and no key to manage. You can
                    revoke GitHub access any time at
                  </p>
                </div>
              </div>
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="docs-webapp-card-btn"
              >
                Revoke access
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================================
          CLI — Figma 244:3062. Heading + deck, divider, 3-step
          install row (Install / Setup / Run with command pills),
          divider, command reference list with per-row dividers,
          and a Pricing footer block.
          =========================================================== */}
      <section className="docs-section docs-cli">
        <div className="docs-cli-inner">
          <div className="docs-section-heading">
            <h2 className="docs-section-title">CLI</h2>
            <p className="docs-section-deck">
              Run AskScout locally on your machine, with your own LLM key.
              Works in any local git repo, including private ones and
              self-hosted git.
            </p>
          </div>

          <div className="docs-cli-divider" />

          <div className="docs-cli-steps">
            <div className="docs-cli-step">
              <div className="docs-cli-step-content">
                <span className="docs-cli-step-icon" aria-hidden>
                  <Download size={28} strokeWidth={1.25} />
                </span>
                <div className="docs-cli-step-text">
                  <h3>Install</h3>
                  <p>
                    Copy the command below into your terminal to install
                    AskScout globally.
                  </p>
                </div>
              </div>
              <CommandChip command="npm install -g askscout" />
            </div>
            <div className="docs-cli-step">
              <div className="docs-cli-step-content">
                <span className="docs-cli-step-icon" aria-hidden>
                  <Settings size={28} strokeWidth={1.25} />
                </span>
                <div className="docs-cli-step-text">
                  <h3>Setup</h3>
                  <p>
                    Run setup once to save your Anthropic or OpenAI API key
                    locally. The key stays on your machine and never goes
                    anywhere except the LLM provider you configured.
                  </p>
                </div>
              </div>
              <CommandChip command="askscout --setup" />
            </div>
            <div className="docs-cli-step">
              <div className="docs-cli-step-content">
                <span className="docs-cli-step-icon" aria-hidden>
                  <PlaySquare size={28} strokeWidth={1.25} />
                </span>
                <div className="docs-cli-step-text">
                  <h3>Run</h3>
                  <p>
                    Run AskScout in any git repo. Your first digest covers
                    today, and every run after picks up from there.
                  </p>
                </div>
              </div>
              <CommandChip command="askscout" />
            </div>
          </div>

          <div className="docs-cli-divider" />

          <div className="docs-cli-commands">
            <div className="docs-cli-commands-head">
              <h3>Commands</h3>
              <p>
                Every command AskScout supports, with a quick note on when
                to use each one.
              </p>
            </div>
            <div className="docs-cli-commands-list">
              {[
                {
                  cmd: "askscout",
                  desc: "Generate a daily digest of what changed since your last run.",
                },
                {
                  cmd: "askscout --week",
                  desc: "Generate a digest covering the past 7 days. Good for Friday wrap-ups or catching up after time off.",
                },
                {
                  cmd: "askscout --standup",
                  desc: "Format your digest as a Slack/Teams-ready standup with Done, Up Next, and Heads Up sections.",
                },
                {
                  cmd: "askscout --resume",
                  desc: "Generate a context block (tech stack, recent work, current focus, key files) for Claude, Cursor, or Codex. Lets the AI pick up your project on a new session without you explaining it.",
                },
                {
                  cmd: "askscout --json",
                  desc: "Output the digest as machine-readable JSON. Useful for scripts, dashboards, or CI.",
                },
                {
                  cmd: "askscout --setup",
                  desc: "Save or replace your API key. Cannot be combined with other options.",
                },
                {
                  cmd: "askscout --dry-run",
                  desc: "Preview which commits AskScout would include, without calling the LLM. No cost and nothing gets saved.",
                },
              ].map((row) => (
                <div key={row.cmd}>
                  <div className="docs-cli-cmd-divider" />
                  <div className="docs-cli-cmd-row">
                    <DocsCliCmdInline command={row.cmd} />
                    <p className="docs-cli-cmd-desc">{row.desc}</p>
                  </div>
                </div>
              ))}
              <div className="docs-cli-cmd-divider" />
            </div>
          </div>

          <div className="docs-cli-pricing">
            <h3>Pricing</h3>
            <p>A typical digest runs about $0.001 to $0.003.</p>
            <p>
              The CLI is free open source software. You bring your own
              Anthropic or OpenAI API key, paid directly to your provider.
              AskScout is designed to be cost-effective. A single API call
              per digest covers everything, which keeps token usage low and
              avoids the repeated round trips most LLM products rack up.
            </p>
          </div>
        </div>
      </section>

      {/* ===========================================================
          FAQ — Figma 244:3186. Reuses the homepage FAQTabs design
          system (.home-faq-*) for 1:1 parity. Two tabs (Web app,
          CLI) with docs-specific questions. Full-bleed top border
          with 104px section padding per the standard rhythm.
          =========================================================== */}
      <section className="docs-section docs-faq">
        <div className="home-faq-inner">
          <DocsFAQ />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
