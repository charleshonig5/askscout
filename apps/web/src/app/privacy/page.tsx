import Link from "next/link";

export const metadata = {
  title: "Privacy | askscout",
  description:
    "What data askscout collects, where it's stored, who it's shared with, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <main className="public-page">
      <nav className="public-nav">
        <Link href="/" className="public-nav-logo">
          askscout
        </Link>
        <div className="public-nav-links">
          <Link href="/articles">Articles</Link>
          <Link href="/docs">Docs</Link>
          <Link href="/privacy">Privacy</Link>
        </div>
      </nav>

      <div className="public-content">
        <h1 className="public-title">Privacy</h1>

        <section className="public-section">
          <p className="public-text">
            Plain English, no lawyer-speak. Last updated April 30, 2026.
          </p>
          <p className="public-text">
            This page covers the askscout web app at askscout.dev. The askscout CLI is a separate
            tool that runs on your machine and follows different rules — see the{" "}
            <Link href="/docs">Docs</Link> page for the CLI&apos;s privacy notes.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Who runs askscout</h2>
          <p className="public-text">
            askscout is built and operated by Charles Honig. Questions, requests, or concerns about
            your data go to <strong>charleshonigdesign@gmail.com</strong>.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What we collect when you sign in</h2>
          <p className="public-text">
            Sign-in uses GitHub OAuth. When you authorize askscout, GitHub gives us:
          </p>
          <ul className="public-list">
            <li>Your GitHub user ID, username, display name, email, and avatar URL</li>
            <li>An access token scoped to read your user profile and your repositories</li>
          </ul>
          <p className="public-text">
            The OAuth scope we request is <code className="inline-code">read:user repo</code>. The{" "}
            <code className="inline-code">repo</code> portion of that scope is broad — GitHub
            doesn&apos;t offer a read-only repository scope, so granting access necessarily includes
            permissions we don&apos;t use (like writing to repos). askscout only ever reads commits
            and diffs; it does not create, modify, or delete anything in your repos.
          </p>
          <p className="public-text">
            You can revoke the OAuth grant at any time at{" "}
            <a
              href="https://github.com/settings/applications"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/settings/applications
            </a>
            .
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What we collect while you use the app</h2>
          <ul className="public-list">
            <li>
              <strong>Digest content</strong> — the daily/weekly summaries Scout generates from your
              git history, plus the underlying stats (commit count, files changed, lines added /
              removed)
            </li>
            <li>
              <strong>Per-repo settings</strong> — your default repo, which digest sections you
              choose to show or hide
            </li>
            <li>
              <strong>Quiet-day check-ins</strong> — a small record (date + repo) when you visit on
              a day with no commits, so your streaks stay alive
            </li>
            <li>
              <strong>Project summary</strong> — a short rolling description of each repo we track,
              regenerated each run, used to give the next digest context
            </li>
          </ul>
          <p className="public-text">
            We do not collect analytics, behavioral telemetry, or third-party tracking pixels. We do
            not sell or rent any user data.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">What gets sent to GitHub and the LLM provider</h2>
          <p className="public-text">
            To generate a digest, askscout reads commits and diffs from your repository through the
            GitHub API and sends them to a large language model to summarize. Specifically:
          </p>
          <ul className="public-list">
            <li>
              Commit messages, timestamps, authors, and the list of files each commit touched are
              sent to the LLM
            </li>
            <li>
              Diff patches (the lines added and removed) are sent to the LLM, truncated to a
              reasonable size cap per file
            </li>
            <li>
              File paths are sent. Full source files, environment variables, secrets, and build
              artifacts are not
            </li>
          </ul>
          <p className="public-text">
            The LLM provider processes this content to produce the digest text. Treat askscout the
            same way you&apos;d treat any code-sharing tool: don&apos;t use it on repositories that
            contain credentials, secrets, or content you wouldn&apos;t paste into another LLM.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Where data is stored</h2>
          <ul className="public-list">
            <li>
              <strong>User account, digests, settings, check-ins, project summaries</strong> —
              stored in our Supabase database, scoped to your user ID. Other users cannot read your
              data
            </li>
            <li>
              <strong>Session</strong> — handled by NextAuth via an HTTP-only cookie that holds your
              GitHub access token. The cookie expires when your session does
            </li>
            <li>
              <strong>API keys (LLM providers)</strong> — held server-side as environment variables.
              Never written to the browser or shared with users
            </li>
          </ul>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Third parties</h2>
          <p className="public-text">
            askscout uses the following services to operate. Each has its own privacy policy:
          </p>
          <ul className="public-list">
            <li>
              <strong>GitHub</strong> — sign-in, repository access, commit and diff fetches
            </li>
            <li>
              <strong>Supabase</strong> — database hosting for the data described above
            </li>
            <li>
              <strong>Vercel</strong> — web hosting and edge delivery
            </li>
            <li>
              <strong>An LLM provider</strong> (Anthropic or OpenAI, depending on which API key the
              app is configured with) — receives the commit / diff payload during digest generation
              and returns the summary text
            </li>
          </ul>
          <p className="public-text">
            We do not embed third-party analytics, advertising trackers, or social-media pixels.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Cookies</h2>
          <p className="public-text">
            askscout sets one essential cookie — the NextAuth session cookie — used solely to keep
            you signed in. It is HTTP-only and Secure-flagged. We do not set marketing or analytics
            cookies.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Your rights and controls</h2>
          <ul className="public-list">
            <li>
              <strong>See your data</strong> — everything we have on you is rendered in the app on
              the Dashboard, Insights, and Settings pages
            </li>
            <li>
              <strong>Clear individual digests</strong> — Settings → Clear History (per repo or all
              at once)
            </li>
            <li>
              <strong>Delete your account</strong> — Settings → Danger Zone → Delete Account. This
              removes every record tied to your user ID from our database. You&apos;ll need to sign
              in with GitHub again to use askscout afterwards
            </li>
            <li>
              <strong>Revoke GitHub access</strong> — at{" "}
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/settings/applications
              </a>
              . This stops us from making any further reads but doesn&apos;t delete data already
              stored — use the account-deletion option above to remove that
            </li>
            <li>
              <strong>Other requests</strong> — for anything not covered by the in-app controls
              (data export, specific edits, restrictions on processing), email{" "}
              <strong>charleshonigdesign@gmail.com</strong>. We aim to respond within seven days
            </li>
          </ul>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Retention</h2>
          <p className="public-text">
            Digests, project summaries, settings, and check-ins are retained as long as your account
            exists. They are deleted when you clear them in-app or delete your account. We do not
            keep backups of deleted user data beyond standard short-term operational backups
            maintained by Supabase, which roll off on their normal cycle.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Children</h2>
          <p className="public-text">
            askscout is not directed at children under 13 and we do not knowingly collect data from
            them. If you believe a child has signed up, contact us and we will delete the account.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Changes to this policy</h2>
          <p className="public-text">
            If we change how data is handled in a meaningful way, we&apos;ll update this page and
            change the &quot;last updated&quot; date at the top. Material changes will be surfaced
            in the app the next time you sign in.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Contact</h2>
          <p className="public-text">
            Questions, data requests, or concerns: <strong>charleshonigdesign@gmail.com</strong>.
          </p>
        </section>
      </div>
    </main>
  );
}
