import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Docs | AskScout",
  description:
    "AskScout docs. Quickstart, CLI reference, output format, configuration, and troubleshooting for the daily digest.",
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
            Web app, CLI, output format, and configuration. Everything you need to read your repo
            in 10 seconds.
          </p>
        </div>
      </header>

      <div className="page-body">
        {/* QUICKSTART */}
        <section className="public-section">
          <h2 className="public-section-title">Quickstart</h2>
          <div className="resource-steps">
            <div className="resource-step">
              <span className="resource-step-num">1</span>
              <div>
                <h3 className="resource-step-title">Sign in (web)</h3>
                <p className="public-text">
                  Open <a href="/" className="home-prose-link">askscout.dev</a> and sign in with
                  GitHub. The OAuth flow grants read-only access to your commits.
                </p>
              </div>
            </div>
            <div className="resource-step">
              <span className="resource-step-num">2</span>
              <div>
                <h3 className="resource-step-title">Or install the CLI</h3>
                <p className="public-text">
                  Run <code className="inline-code">npm install -g askscout</code>, then{" "}
                  <code className="inline-code">askscout --setup</code> to add your API key. The CLI
                  works in any local git repo.
                </p>
              </div>
            </div>
            <div className="resource-step">
              <span className="resource-step-num">3</span>
              <div>
                <h3 className="resource-step-title">Read your digest</h3>
                <p className="public-text">
                  Run <code className="inline-code">askscout</code> in a repo, or pick a repo on the
                  web. Your first digest covers today. Tomorrow it covers yesterday. The format
                  stays the same.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CLI REFERENCE */}
        <section className="public-section">
          <h2 className="public-section-title">CLI reference</h2>
          <p className="public-text">
            All flags, what they do, and when to reach for them.
          </p>
          <div className="resource-commands">
            <div className="resource-command">
              <code className="inline-code">askscout</code>
              <span className="resource-command-desc">
                Default daily digest. Covers commits since your last run, or today if this is your
                first time.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --week</code>
              <span className="resource-command-desc">
                Past 7 days instead of since-last-run. Useful for Friday wrap-ups or catching up
                after time off.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --standup</code>
              <span className="resource-command-desc">
                Yesterday / Today / Heads Up format. Paste straight into Slack or Teams.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --resume</code>
              <span className="resource-command-desc">
                Tech stack, recent work, current focus, and key files in a single block. Paste into
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
                output written. Good for testing config.
              </span>
            </div>
          </div>
          <p className="public-text">
            <code className="inline-code">--standup</code> and{" "}
            <code className="inline-code">--resume</code> cannot be combined.{" "}
            <code className="inline-code">--setup</code> ignores all other flags.
          </p>
        </section>

        {/* DIGEST FORMAT */}
        <section className="public-section">
          <h2 className="public-section-title">Understanding your digest</h2>
          <p className="public-text">
            Every digest follows the same shape. Here is what each section is for.
          </p>
          <div className="resource-commands">
            <div className="resource-command">
              <code className="inline-code">💬 Vibe Check</code>
              <span className="resource-command-desc">
                A short read on where the project stands right now. Where you are, what you are
                circling, what you are avoiding.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">🚀 Shipped</code>
              <span className="resource-command-desc">
                Things that went from not existing to working. New features, new endpoints, new
                pages.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">🔧 Changed</code>
              <span className="resource-command-desc">
                Things that already existed and got modified. Refactors, redesigns, config tweaks.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">🔁 Still Shifting</code>
              <span className="resource-command-desc">
                Areas reworked 3+ times in the window. Often a sign that the design is fighting
                you.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">📍 Left Off</code>
              <span className="resource-command-desc">
                Anything in progress when the session ended. Usually the best starting point for
                tomorrow.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">🔑 Key Takeaways</code>
              <span className="resource-command-desc">
                A two-or-three-sentence sign-off. The single sharpest observation plus the next
                meaningful move.
              </span>
            </div>
          </div>
          <h3 className="public-card-title" style={{ marginTop: 24 }}>Codebase Health</h3>
          <p className="public-text">
            Three signals computed from your raw activity, not the LLM.
          </p>
          <div className="resource-commands">
            <div className="resource-command">
              <code className="inline-code">Growth</code>
              <span className="resource-command-desc">
                Ratio of lines added to lines removed. Lean → Steady → Growing → Heavy → Ballooning.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">Focus</code>
              <span className="resource-command-desc">
                Average files touched per commit. Tight → Sharp → Moderate → Wide → Scattered.
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">Churn</code>
              <span className="resource-command-desc">
                Files reworked 3+ times in the window. Clean → Minimal → Moderate → Noisy → High.
              </span>
            </div>
          </div>
          <h3 className="public-card-title" style={{ marginTop: 24 }}>Pace Check</h3>
          <p className="public-text">
            A multiplier showing today versus your recent average (e.g. <em>1.7x</em>). Needs at
            least 3 prior digest runs before it appears, so the baseline is not statistical noise.
            On runs 1 and 2 the section is hidden.
          </p>
          <h3 className="public-card-title" style={{ marginTop: 24 }}>Quiet days</h3>
          <p className="public-text">
            If no new commits land in the window, AskScout prints a one-line note instead of a full
            digest and suggests <code className="inline-code">askscout --week</code> if you want a
            longer view.
          </p>
        </section>

        {/* CONFIGURATION */}
        <section className="public-section">
          <h2 className="public-section-title">Configuration</h2>
          <h3 className="public-card-title">Config file</h3>
          <p className="public-text">
            Your API key lives at <code className="inline-code">~/.askscout/config.json</code> with{" "}
            <code className="inline-code">chmod 600</code> (owner read/write only). The shape:
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
            to OpenAI.
          </p>
          <h3 className="public-card-title" style={{ marginTop: 24 }}>Models</h3>
          <p className="public-text">
            Defaults: <code className="inline-code">claude-haiku-4-5-20250414</code> for Anthropic,{" "}
            <code className="inline-code">gpt-4o-mini</code> for OpenAI. Override by setting the{" "}
            <code className="inline-code">model</code> field in the config file. The defaults are
            chosen for speed and cost (about $0.001 to $0.003 per digest); larger models work but
            run slower.
          </p>
          <h3 className="public-card-title" style={{ marginTop: 24 }}>Per-project state</h3>
          <p className="public-text">
            Each repo gets its own <code className="inline-code">.askscout/state.json</code> in the
            project root. AskScout stores: last run timestamp, run count, the rolling 10-run digest
            history (used for Pace Check), and a 200-word AI-maintained summary of the project that
            feeds back into the next run. Add this folder to your{" "}
            <code className="inline-code">.gitignore</code> if you want to keep it out of version
            control.
          </p>
          <h3 className="public-card-title" style={{ marginTop: 24 }}>Piping and scripts</h3>
          <p className="public-text">
            When stdout is not a TTY (you piped output, or set{" "}
            <code className="inline-code">NO_COLOR=1</code>), AskScout drops the emoji headers and
            unicode bullets. Section labels switch to bracketed plain text like{" "}
            <code className="inline-code">[Vibe Check]</code> and{" "}
            <code className="inline-code">[Shipped]</code>. Use{" "}
            <code className="inline-code">askscout --json</code> if you want structured data.
          </p>
        </section>

        {/* TROUBLESHOOTING */}
        <section className="public-section">
          <h2 className="public-section-title">Troubleshooting</h2>
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
              <h3 className="faq-question">API key invalid or rejected</h3>
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
                Pace Check needs 3 prior runs to compute a real baseline. Keep running daily and it
                shows up on run 4.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Running in CI or cron</h3>
              <p className="public-text">
                Pipe to a file or post-process with <code className="inline-code">--json</code>.
                AskScout drops the spinner and emoji automatically when stdout is not a TTY, so the
                output stays readable in CI logs.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Reset everything</h3>
              <p className="public-text">
                Delete <code className="inline-code">~/.askscout</code> to clear your config and
                global state. Delete <code className="inline-code">.askscout</code> inside a repo
                to clear that project's history and summary.
              </p>
            </div>
          </div>
        </section>

        {/* DOCS FAQ */}
        <section className="public-section">
          <h2 className="public-section-title">Docs FAQ</h2>
          <p className="public-text">
            For broader product questions (privacy, pricing, what AskScout reads),{" "}
            <Link href="/" className="home-prose-link">see the homepage FAQ</Link>. The questions
            below are docs-specific.
          </p>
          <div className="faq-list">
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
            <div className="faq-item">
              <h3 className="faq-question">Can I use AskScout without internet access?</h3>
              <p className="public-text">
                The CLI reads commits locally but still calls Anthropic or OpenAI for the
                summary, which needs internet. Fully offline mode is not supported.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Does the CLI work on Windows?</h3>
              <p className="public-text">
                Yes, on Node 22+ via PowerShell, CMD, or WSL. File paths in this doc use the macOS
                / Linux home shorthand <code className="inline-code">~/</code>; on Windows the
                config lives at{" "}
                <code className="inline-code">%USERPROFILE%\.askscout\config.json</code>.
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
              <h3 className="faq-question">Where is the changelog?</h3>
              <p className="public-text">
                Releases are tagged on{" "}
                <a
                  href="https://github.com/charleshonig5/askscout/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="home-prose-link"
                >
                  GitHub
                </a>
                . Each release includes notes on what changed in the CLI and the web app.
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
