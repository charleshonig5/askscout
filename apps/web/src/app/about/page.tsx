import Link from "next/link";

export const metadata = {
  title: "About | askscout",
  description:
    "Scout is a daily digest tool for vibe coders. Learn why it exists and who built it.",
};

export default function AboutPage() {
  return (
    <main className="public-page">
      <nav className="public-nav">
        <Link href="/" className="public-nav-logo">
          askscout
        </Link>
        <div className="public-nav-links">
          <Link href="/about">About</Link>
          <Link href="/resources">Resources</Link>
        </div>
      </nav>

      <div className="public-content">
        <h1 className="public-title">About Scout</h1>

        <section className="public-section">
          <h2 className="public-section-title">The Problem</h2>
          <p className="public-text">
            Vibe coders push 30+ commits in a single session. AI-generated commit messages are
            useless. By the end of the day, you have no idea what state your project is in. The
            current solution is "ask your AI to summarize before you close your laptop." Nobody does
            this.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">The Solution</h2>
          <p className="public-text">
            One command or one click. Scout sniffs through your git history and tells you, in plain
            English, what you built, what changed, what keeps shifting, and where you left off. It
            gets smarter every time you use it because it remembers your project across sessions.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What Scout Reads</h2>
          <p className="public-text">
            Commit messages, timestamps, and file diffs. That is it. Scout never opens your source
            code files, never touches your environment variables, never accesses secrets or
            credentials. Diffs are processed in memory and discarded. Only the plain-English digest
            is stored.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Three Ways to Use It</h2>
          <div className="public-cards">
            <div className="public-card">
              <h3 className="public-card-title">Daily Digest</h3>
              <p className="public-card-text">
                What shipped, what changed, what keeps shifting, where you left off. Your daily
                project status in 30 seconds.
              </p>
            </div>
            <div className="public-card">
              <h3 className="public-card-title">Standup</h3>
              <p className="public-card-text">
                Done, Up Next, Heads Up. Formatted for Slack. Copy, paste, move on with your
                morning.
              </p>
            </div>
            <div className="public-card">
              <h3 className="public-card-title">Resume where you left off</h3>
              <p className="public-card-text">
                A context prompt you paste into your AI coding tool of choice to pick up exactly
                where you stopped. Saves 20 minutes every morning.
              </p>
            </div>
          </div>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Who Built This</h2>
          <p className="public-text">
            askscout was built by a solo developer who kept losing track of what they built during
            long vibe coding sessions. The idea was simple: if the AI writes the code, the AI should
            also be able to tell you what it did. Scout is that report.
          </p>
          <p className="public-text">
            The CLI is free forever with your own API key. The web app is free to try. No credit
            card required.
          </p>
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
