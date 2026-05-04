import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallChip } from "@/components/InstallChip";

export const metadata = {
  title: "Docs | AskScout",
  description:
    "AskScout docs. How to use the web app, the CLI, and answers to common questions.",
};

export default function DocsPage() {
  return (
    <main className="page">
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

      <header className="page-header">
        <div className="page-header-inner">
          <p className="home-eyebrow">Docs</p>
          <h1 className="page-title">Run AskScout your way.</h1>
          <p className="page-deck">
            AskScout is an open source daily digest tool for developers and vibe coders. It reads
            your git activity and writes a digestible, plain-English summary of what you worked
            on each day. Use the web app or run the CLI locally on your device.
          </p>
        </div>
      </header>

      <div className="page-body">
        {/* WEB */}
        <section className="public-section">
          <h2 className="public-section-title">Web app</h2>
          <p className="public-text">
            The fastest way to start. Hosted, no key to manage, your digest history saved under
            your account.
          </p>
          <div className="resource-steps">
            <div className="resource-step">
              <span className="resource-step-num">1</span>
              <div>
                <h3 className="resource-step-title">Sign in with GitHub</h3>
                <p className="public-text">
                  Open <Link href="/" className="home-prose-link">askscout.dev</Link> and sign in. The
                  OAuth flow grants read-only access to your commits. You can revoke any time at{" "}
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
              </div>
            </div>
            <div className="resource-step">
              <span className="resource-step-num">2</span>
              <div>
                <h3 className="resource-step-title">Pick a repo</h3>
                <p className="public-text">
                  Choose any repo you have access to, public or private. AskScout pulls the recent
                  commit history through the GitHub API and starts streaming a digest.
                </p>
              </div>
            </div>
            <div className="resource-step">
              <span className="resource-step-num">3</span>
              <div>
                <h3 className="resource-step-title">Read your digest</h3>
                <p className="public-text">
                  Each digest covers Shipped, Changed, Still Shifting, and Left Off, plus
                  Codebase Health and a Pace Check after a few runs. Copy, download, email, or
                  generate a standup or to-do from the same page.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CLI */}
        <section className="public-section">
          <h2 className="public-section-title">CLI</h2>
          <p className="public-text">
            Run AskScout entirely on your machine, with your own LLM key. Works in any local git
            repo, including private ones and self-hosted git.
          </p>

          <h3 className="public-card-title" style={{ marginTop: 16 }}>Install</h3>
          <div style={{ marginBottom: 12 }}>
            <InstallChip />
          </div>
          <p className="public-text">
            Then run <code className="inline-code">askscout --setup</code> once to save your API
            key. After that, <code className="inline-code">askscout</code> in any repo prints a
            digest.
          </p>

          <h3 className="public-card-title" style={{ marginTop: 24 }}>Commands</h3>
          <div className="resource-commands">
            <div className="resource-command">
              <code className="inline-code">askscout</code>
              <span className="resource-command-desc">
                Daily digest. Covers commits since your last run.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --week</code>
              <span className="resource-command-desc">
                Past 7 days instead of since-last-run. Good for Friday wrap-ups or catching up
                after time off.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --standup</code>
              <span className="resource-command-desc">
                Yesterday / Today / Heads Up format, ready to paste into Slack or Teams.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --resume</code>
              <span className="resource-command-desc">
                Tech stack, recent work, current focus, and key files in one block. Paste into
                Claude, Cursor, or Copilot to skip the catch-up step.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --json</code>
              <span className="resource-command-desc">
                Machine-readable JSON. Pipe into your own scripts, dashboards, or CI jobs.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --setup</code>
              <span className="resource-command-desc">
                Save or replace your API key. Cannot be combined with other flags.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --dry-run</code>
              <span className="resource-command-desc">
                Lists the commits AskScout would summarize without calling the LLM. No charges, no
                output written.
              </span>
            </div>
          </div>
          <p className="public-text">
            <code className="inline-code">--standup</code> and{" "}
            <code className="inline-code">--resume</code> cannot be combined.{" "}
            <code className="inline-code">--setup</code> ignores all other flags.
          </p>

          <h3 className="public-card-title" style={{ marginTop: 24 }}>Configuration</h3>
          <p className="public-text">
            Your API key lives at <code className="inline-code">~/.askscout/config.json</code>{" "}
            with <code className="inline-code">chmod 600</code> (owner read/write only).
          </p>
          <div className="resource-code-block">
            <code>
              {`{
  "provider": "anthropic" | "openai",
  "apiKey": "sk-...",
  "model": "claude-haiku-4-5-20250414"  // optional
}`}
            </code>
          </div>
          <p className="public-text">
            Provider auto-detects from the key prefix. Keys starting with{" "}
            <code className="inline-code">sk-ant-</code> route to Anthropic. Anything else routes
            to OpenAI. Defaults: <code className="inline-code">claude-haiku-4-5-20250414</code> on
            Anthropic, <code className="inline-code">gpt-4o-mini</code> on OpenAI. Cost runs
            roughly $0.001 to $0.003 per digest.
          </p>
          <p className="public-text">
            Each repo also gets a small{" "}
            <code className="inline-code">.askscout/state.json</code> in the project root. It
            stores the last run timestamp, run count, the rolling 10-run history (used for Pace
            Check), and a 200-word AI-maintained summary of the project that feeds back into the
            next run. Add the folder to your <code className="inline-code">.gitignore</code> if
            you want to keep it out of version control.
          </p>
        </section>

        {/* FAQ */}
        <section className="public-section">
          <h2 className="public-section-title">FAQ</h2>
          <p className="public-text">
            For broader product questions (privacy, pricing, what AskScout reads),{" "}
            <Link href="/" className="home-prose-link">see the homepage FAQ</Link>. The questions
            below are docs-specific.
          </p>
          <div className="faq-list">
            <div className="faq-item">
              <h3 className="faq-question">"Scout didn't find any new commits"</h3>
              <p className="public-text">
                AskScout looks at commits since your last run by default. If that window is empty,
                try <code className="inline-code">askscout --week</code> for the past 7 days, or{" "}
                <code className="inline-code">askscout --dry-run</code> to confirm what is in the
                window.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">My API key keeps getting rejected</h3>
              <p className="public-text">
                Run <code className="inline-code">askscout --setup</code> again to overwrite the
                key. Anthropic keys start with <code className="inline-code">sk-ant-</code> and
                OpenAI keys start with <code className="inline-code">sk-</code>. If yours starts
                with neither, AskScout cannot route it.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Pace Check is missing from my digest</h3>
              <p className="public-text">
                Pace Check needs 3 prior runs to compute a real baseline. Keep running daily and
                it shows up on run 4.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Does the CLI work on Windows?</h3>
              <p className="public-text">
                Yes, on Node 22+ via PowerShell, CMD, or WSL. The config lives at{" "}
                <code className="inline-code">%USERPROFILE%\.askscout\config.json</code> on
                Windows.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Can I run AskScout in CI or cron?</h3>
              <p className="public-text">
                Yes. Use <code className="inline-code">askscout --json</code> for parseable
                output, or pipe the default output to a file. AskScout drops the spinner and
                emoji automatically when stdout is not a TTY, so logs stay readable.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">How do I switch providers?</h3>
              <p className="public-text">
                Run <code className="inline-code">askscout --setup</code> and paste a key from the
                other provider. AskScout overwrites the existing config in place.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">How do I reset everything?</h3>
              <p className="public-text">
                Delete <code className="inline-code">~/.askscout</code> to clear your config and
                global state. Delete <code className="inline-code">.askscout</code> inside a repo
                to clear that project's history and summary.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Where do I report a bug or request a feature?</h3>
              <p className="public-text">
                Open an issue at{" "}
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
            </div>
          </div>
        </section>

        <div className="public-cta">
          <Link href="/" className="btn btn-primary" style={{ fontSize: 15, padding: "10px 24px" }}>
            Try AskScout
          </Link>
        </div>
      </div>
    </main>
  );
}
