import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Privacy | AskScout",
  description:
    "What data AskScout collects, where it's stored, who it's shared with, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <main className="page">
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

      <header className="page-header">
        <div className="page-header-inner">
          <p className="home-eyebrow">Policy</p>
          <h1 className="page-title">Privacy</h1>
          <p className="page-deck">Plain English, no lawyer-speak. Last updated May 4, 2026.</p>
        </div>
      </header>

      <div className="page-body page-body--reading">
        <section className="public-section">
          <h2 className="public-section-title">What we collect when you sign in</h2>
          <p className="public-text">
            Sign-in uses GitHub OAuth. When you authorize AskScout, GitHub returns your user ID,
            username, display name, email, avatar URL, and a scoped access token.
          </p>
          <p className="public-text">
            Of those, only your <strong>GitHub user ID</strong> and <strong>username</strong> are
            stored in our database long term. Display name, email, and avatar URL live in your
            session cookie and are read from GitHub on each sign-in. We do not persist them in
            our database.
          </p>
          <p className="public-text">
            The OAuth scope we request is <code className="inline-code">read:user repo</code>. The{" "}
            <code className="inline-code">repo</code> portion of that scope is broad. GitHub
            doesn&apos;t offer a read-only repository scope, so granting access necessarily
            includes permissions we don&apos;t use (like writing to repos). AskScout only ever
            reads commits and diffs. It does not create, modify, or delete anything in your repos.
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
              <strong>Digest content</strong>: the daily/weekly summaries Scout generates from your
              git history, plus the underlying stats (commit count, files changed, lines added /
              removed)
            </li>
            <li>
              <strong>Per-repo settings</strong>: your default repo, which digest sections you
              choose to show or hide
            </li>
            <li>
              <strong>Quiet-day check-ins</strong>: a small record (date + repo) when you visit on a
              day with no commits, so your streaks stay alive
            </li>
            <li>
              <strong>Project summary</strong>: a short rolling description of each repo we track,
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
            To generate a digest, AskScout reads commits and diffs from your repository through the
            GitHub API and sends them to a large language model to summarize. Specifically:
          </p>
          <ul className="public-list">
            <li>
              Commit messages, timestamps, authors, and the list of files each commit touched are
              sent to the LLM
            </li>
            <li>
              Diff patches (the lines added and removed) are sent to the LLM, truncated against
              a global ~16,000-character cap per run with the largest patches trimmed first
            </li>
            <li>
              File paths are sent. Full source files, environment variables, secrets, and build
              artifacts are not
            </li>
          </ul>
          <p className="public-text">
            The LLM provider processes this content to produce the digest text. Treat AskScout
            the same way you would any tool that shares code with an LLM. Do not use it on
            repositories that contain credentials, secrets, or content you would not paste into
            an AI chat.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Where data is stored</h2>
          <ul className="public-list">
            <li>
              <strong>User account, digests, settings, check-ins, project summaries</strong>:
              stored in our Supabase database, scoped to your user ID. Other users cannot read
              your data
            </li>
            <li>
              <strong>Session</strong>: handled by NextAuth via an HTTP-only cookie that holds
              your GitHub access token. The cookie expires when your session does
            </li>
            <li>
              <strong>API keys (LLM providers)</strong>: held server-side as environment
              variables. Never written to the browser or shared with users
            </li>
          </ul>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Data location and international transfers</h2>
          <p className="public-text">
            AskScout is hosted on Vercel and uses Supabase for database storage, both
            US-headquartered providers. If you sign up from outside the United States, your data
            is transferred to and processed in the United States. By using AskScout you consent
            to that transfer. We do not currently offer regional data residency.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Security</h2>
          <ul className="public-list">
            <li>
              <strong>In transit</strong>: all traffic to askscout.dev, the GitHub API, and the
              LLM provider runs over TLS
            </li>
            <li>
              <strong>At rest</strong>: Supabase encrypts the database at rest by default
            </li>
            <li>
              <strong>Access control</strong>: every database row is keyed to a user ID. Queries
              from the app server filter by the signed-in user. There is no admin UI that lets
              one user read another user&apos;s data
            </li>
            <li>
              <strong>Secrets</strong>: LLM API keys and OAuth client secrets live in server-side
              environment variables and are never sent to the browser
            </li>
          </ul>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Third parties</h2>
          <p className="public-text">
            AskScout uses the following services to operate. Each has its own privacy policy:
          </p>
          <ul className="public-list">
            <li>
              <strong>GitHub</strong>: sign-in, repository access, commit and diff fetches
            </li>
            <li>
              <strong>Supabase</strong>: database hosting for the data described above
            </li>
            <li>
              <strong>Vercel</strong>: web hosting and edge delivery
            </li>
            <li>
              <strong>An LLM provider</strong> (Anthropic or OpenAI, depending on which API key the
              app is configured with). Receives the commit / diff payload during digest generation
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
            AskScout sets one essential cookie, the NextAuth session cookie, used solely to keep you
            signed in. It is HTTP-only and Secure-flagged. We do not set marketing or analytics
            cookies.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Your rights and controls</h2>
          <ul className="public-list">
            <li>
              <strong>See your data</strong>: everything we have on you is rendered in the app on
              the Dashboard, Insights, and Settings pages
            </li>
            <li>
              <strong>Clear individual digests</strong>: Settings → Clear History (per repo or all
              at once)
            </li>
            <li>
              <strong>Delete your account</strong>: Settings → Danger Zone → Delete Account. This
              removes every record tied to your user ID from our database. You&apos;ll need to sign
              in with GitHub again to use AskScout afterwards
            </li>
            <li>
              <strong>Revoke GitHub access</strong>: at{" "}
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/settings/applications
              </a>
              . This stops us from making any further reads but doesn&apos;t delete data already
              stored. Use the account-deletion option above to remove that
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
          <h2 className="public-section-title">Data breach notification</h2>
          <p className="public-text">
            If we learn of a personal-data breach that meaningfully affects users, we will
            notify affected users by email within 72 hours of confirming the breach, in line
            with the GDPR Article 33 timeline. The notice will describe what happened, what
            data was affected, what we have done in response, and what you can do.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Regional rights (GDPR and CCPA)</h2>
          <p className="public-text">
            We offer the same set of in-app controls and email-based requests to every user
            regardless of location. If you are in the EU/UK or California, the rights described
            under &quot;Your rights and controls&quot; (access, deletion, correction,
            restriction of processing, data export) cover the equivalent rights under GDPR and
            CCPA. We do not sell or share personal data within the meaning of CCPA. Our legal
            basis for processing under GDPR is performance of contract (running the AskScout
            service for you) and your consent at sign-in.
          </p>
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Children</h2>
          <p className="public-text">
            AskScout is not directed at children under 13 and we do not knowingly collect data from
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

      </div>
      <SiteFooter />
    </main>
  );
}
