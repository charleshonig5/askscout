import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "Docs | askscout",
  description: "Guides, setup instructions, and documentation for askscout.",
};

export default function DocsPage() {
  return (
    <main className="page">
      <nav className="home-nav" aria-label="Site">
        <Link href="/" className="home-nav-logo">
          askscout
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
          <p className="home-eyebrow">Get started</p>
          <h1 className="page-title">Docs</h1>
          <p className="page-deck">
            Install, sign in, run a digest. The whole onboarding takes about ten seconds.
          </p>
        </div>
      </header>

      <div className="page-body">
        <section className="public-section">
          <h2 className="public-section-title">Getting Started (Web)</h2>
          <div className="resource-steps">
            <div className="resource-step">
              <span className="resource-step-num">1</span>
              <div>
                <h3 className="resource-step-title">Sign in with GitHub</h3>
                <p className="public-text">
                  Scout uses read-only access to your commit history. No write permissions, no code
                  access.
                </p>
              </div>
            </div>
            <div className="resource-step">
              <span className="resource-step-num">2</span>
              <div>
                <h3 className="resource-step-title">Pick a repo</h3>
                <p className="public-text">
                  Select any repo you have access to. Scout will generate your first digest
                  automatically.
                </p>
              </div>
            </div>
            <div className="resource-step">
              <span className="resource-step-num">3</span>
              <div>
                <h3 className="resource-step-title">Read your digest</h3>
                <p className="public-text">
                  Scout streams your digest in real time. Come back tomorrow and it gets smarter
                  because it remembers your project.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Getting Started (CLI)</h2>
          <div className="resource-code-block">
            <code>npx askscout</code>
          </div>
          <p className="public-text">
            Run it in any git repository. First run prompts for your LLM API key. The key is stored
            locally in <code className="inline-code">~/.askscout/config.json</code> and never leaves
            your machine.
          </p>
          <div className="resource-commands">
            <div className="resource-command">
              <code className="inline-code">askscout</code>
              <span className="resource-command-desc">Daily digest (default)</span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --standup</code>
              <span className="resource-command-desc">Copy-paste standup for Slack</span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --resume</code>
              <span className="resource-command-desc">
                AI context to paste into your coding tool
              </span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --week</code>
              <span className="resource-command-desc">Past 7 days instead of today</span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --setup</code>
              <span className="resource-command-desc">Configure your API key</span>
            </div>
            <div className="resource-command">
              <code className="inline-code">askscout --dry-run</code>
              <span className="resource-command-desc">
                See what would be sent without calling the API
              </span>
            </div>
          </div>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">API Keys</h2>
          <p className="public-text">
            The CLI uses your own API key (BYOK). Two LLM providers are supported, auto-detected
            from the key format:
          </p>
          <div className="resource-commands">
            <div className="resource-command">
              <code className="inline-code">sk-ant-...</code>
              <span className="resource-command-desc">First provider</span>
            </div>
            <div className="resource-command">
              <code className="inline-code">sk-...</code>
              <span className="resource-command-desc">Second provider</span>
            </div>
          </div>
          <p className="public-text">
            Cost per digest: approximately $0.001 to $0.003. The web app uses a hosted key so you do
            not need your own.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Privacy and Security</h2>
          <div className="public-cards">
            <div className="public-card">
              <h3 className="public-card-title">What Scout reads</h3>
              <p className="public-card-text">
                Commit messages, timestamps, authors, and file diffs (lines added and removed).
              </p>
            </div>
            <div className="public-card">
              <h3 className="public-card-title">What Scout never touches</h3>
              <p className="public-card-text">
                Source code files, environment variables, secrets, credentials, node_modules, or any
                non-git files.
              </p>
            </div>
          </div>
          <p className="public-text">
            CLI: Everything stays local. Git data goes directly to the LLM using your key. Zero
            telemetry. Web: Git data is fetched via the GitHub API, sent to the LLM, and only the
            digest is stored. Diffs are processed in memory and discarded.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">FAQ</h2>
          <div className="faq-list">
            <div className="faq-item">
              <h3 className="faq-question">How much does it cost?</h3>
              <p className="public-text">
                The CLI is free forever (you bring your own API key, ~$0.002 per digest). The web
                app has a free tier with one digest per day per repo.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Does Scout read my source code?</h3>
              <p className="public-text">
                No. Scout reads commit messages and diffs (what changed), not your actual source
                code files. It never opens, parses, or stores your code.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Does it get better over time?</h3>
              <p className="public-text">
                Yes. Scout maintains a project summary that gets rewritten each run. By day 3, it
                knows your tech stack, architecture, and what you have been working on. The digests
                get noticeably more specific.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">What if I skip a day?</h3>
              <p className="public-text">
                Your next digest covers everything since your last one. Skip a day, it covers two
                days. No gaps, no empty digests.
              </p>
            </div>
            <div className="faq-item">
              <h3 className="faq-question">Can I customize what shows up?</h3>
              <p className="public-text">
                Yes. Go to Settings and toggle individual sections on or off. Your preferences
                persist across sessions.
              </p>
            </div>
          </div>
        </section>

        <div className="public-cta">
          <Link href="/" className="btn btn-primary" style={{ fontSize: 15, padding: "10px 24px" }}>
            Try Scout
          </Link>
        </div>
      </div>
    </main>
  );
}
