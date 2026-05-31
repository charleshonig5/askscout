import { MarketingNav } from "@/components/MarketingNav";
import { ReadyCTA } from "@/components/ReadyCTA";
import { SiteFooter } from "@/components/SiteFooter";

/* Single source of truth for the policy's "Last updated" date.
   Renders as both the human-readable string in the hero AND the
   machine-readable dateModified in the WebPage JSON-LD. Bump both
   together when the policy changes. The sitemap entry for /privacy
   should be updated in lockstep too. */
const PRIVACY_LAST_UPDATED_ISO = "2026-05-04";
const PRIVACY_LAST_UPDATED_HUMAN = "May 4, 2026";

export const metadata = {
  title: "Privacy | askScout",
  description:
    "What data askScout collects, where it's stored, who it's shared with, and how to delete it.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy | askScout",
    description:
      "What data askScout collects, where it's stored, who it's shared with, and how to delete it.",
    url: "/privacy",
    siteName: "askScout",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy | askScout",
    description:
      "What data askScout collects, where it's stored, who it's shared with, and how to delete it.",
  },
};

/* WebPage JSON-LD with dateModified so AI search engines and
   Google's freshness signals know exactly when the policy was last
   touched. Privacy pages don't get rich-result snippets, but
   structured data still helps crawlers understand the page type
   and currency. */
const PAGE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "askScout privacy policy",
  description:
    "What data askScout collects, where it's stored, who it's shared with, and how to delete it.",
  url: "https://askscout.dev/privacy",
  inLanguage: "en",
  dateModified: PRIVACY_LAST_UPDATED_ISO,
  isPartOf: {
    "@type": "WebSite",
    name: "askScout",
    url: "https://askscout.dev",
  },
  publisher: {
    "@type": "Organization",
    name: "askScout",
    url: "https://askscout.dev",
  },
};

export default function PrivacyPage() {
  return (
    <main className="page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_SCHEMA) }}
      />
      <MarketingNav />

      {/* ===========================================================
          PRIVACY — Figma 364:12. One continuous body section:
          hero (Pridi 52 "Privacy" + Work Sans Light 20 last-updated
          deck) stacked over 14 policy sections. 54px gap between
          every section; the same 54px gap separates the hero from
          the first section so the rhythm is consistent throughout.
          =========================================================== */}
      <section className="privacy-main">
        <div className="privacy-inner">
          <header className="privacy-hero">
            <h1 className="privacy-hero-title">Privacy</h1>
            <p className="privacy-hero-updated">
              Last Updated{" "}
              <time dateTime={PRIVACY_LAST_UPDATED_ISO}>
                {PRIVACY_LAST_UPDATED_HUMAN}
              </time>
            </p>
          </header>

          <div className="privacy-sections">
            {/* 1. WHAT WE COLLECT WHEN YOU SIGN IN */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">
                What we collect when you sign in
              </h2>
              <div className="privacy-body">
                <p>
                  Sign-in uses GitHub OAuth. When you authorize askScout,
                  GitHub returns your user ID, username, display name, email,
                  avatar URL, and a scoped access token.
                </p>
                <p>
                  Of those, only your GitHub user ID and username are stored
                  in our database long term. Display name, email, and avatar
                  URL live in your session cookie and are read from GitHub on
                  each sign-in. We do not persist them in our database.
                </p>
                <p>
                  The OAuth scope we request is <code>read:user repo</code>.
                  The <code>repo</code> portion of that scope is broad. GitHub
                  doesn&apos;t offer a read-only repository scope, so granting
                  access necessarily includes permissions we don&apos;t use
                  (like writing to repos). askScout only ever reads commits
                  and diffs. It does not create, modify, or delete anything in
                  your repos.
                </p>
                <p>
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
              </div>
            </section>

            {/* 2. WHAT WE COLLECT WHILE YOU USE THE APP */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">
                What we collect while you use the app
              </h2>
              <div className="privacy-body">
                <ul className="privacy-list">
                  <li>
                    <strong>Digest content:</strong> the daily/weekly summaries
                    Scout generates from your git history, plus the underlying
                    stats (commit count, files changed, lines added / removed)
                  </li>
                  <li>
                    <strong>Per-repo settings:</strong> your default repo,
                    which digest sections you choose to show or hide
                  </li>
                  <li>
                    <strong>Quiet-day check-ins:</strong> a small record (date
                    + repo) when you visit on a day with no commits, so your
                    streaks stay alive
                  </li>
                  <li>
                    <strong>Project summary:</strong> a short rolling
                    description of each repo we track, regenerated each run,
                    used to give the next digest context
                  </li>
                </ul>
                <p>
                  We do not collect analytics, behavioral telemetry, or
                  third-party tracking pixels. We do not sell or rent any user
                  data.
                </p>
              </div>
            </section>

            {/* 3. WHAT GETS SENT TO GITHUB AND THE LLM PROVIDER */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">
                What gets sent to GitHub and the LLM provider
              </h2>
              <div className="privacy-body">
                <p>
                  To generate a digest, askScout reads commits and diffs from
                  your repository through the GitHub API and sends them to a
                  large language model to summarize. Specifically:
                </p>
                <ul className="privacy-list">
                  <li>
                    Commit messages, timestamps, authors, and the list of
                    files each commit touched are sent to the LLM
                  </li>
                  <li>
                    Diff patches (the lines added and removed) are sent to the
                    LLM, truncated against a global ~16,000-character cap per
                    run with the largest patches trimmed first
                  </li>
                  <li>
                    Pull request titles and descriptions, plus the titles and
                    bodies of any GitHub issues those pull requests reference
                    (via <code>#N</code>), are sent to the LLM so the digest
                    can ground itself in the stated intent behind each change.
                    Each body is truncated to ~1,500 characters and the list
                    is capped at the 10 most recent pull requests and 10
                    referenced issues per run.
                  </li>
                  <li>
                    For up to the 8 most-changed files in each digest, ~15
                    lines of surrounding source code around every changed hunk
                    are sent so the LLM can read refactors, renames, and
                    sparse edits in context. The content is pulled at the
                    digest&apos;s starting commit (the parent of the oldest
                    commit in the window). Each file&apos;s context is capped
                    at ~3,000 characters and the total across all files is
                    capped at ~24,000 characters per run.
                  </li>
                  <li>
                    Project metadata files (README, plus a single package
                    manifest like <code>package.json</code>,{" "}
                    <code>pyproject.toml</code>, <code>Cargo.toml</code>,{" "}
                    <code>go.mod</code>, <code>composer.json</code>, or{" "}
                    <code>Gemfile</code>) are read at the repository&apos;s
                    default branch so the digest can frame each change in the
                    right project context. README content is truncated to
                    ~3,000 characters and manifest content to ~2,000
                    characters; <code>package.json</code> is filtered to name,
                    description, version, scripts, and dependency lists before
                    being sent. Lock files (<code>package-lock.json</code>,{" "}
                    <code>pnpm-lock.yaml</code>, etc.),{" "}
                    <code>node_modules</code>, and build artifacts are never
                    read.
                  </li>
                  <li>
                    File paths are sent. Full source files outside the changed
                    regions, environment variables, secrets, and build
                    artifacts are not.
                  </li>
                </ul>
                <p>
                  The LLM provider processes this content to produce the
                  digest text. Treat askScout the same way you would any tool
                  that shares code with an LLM. Do not use it on repositories
                  that contain credentials, secrets, or content you would not
                  paste into an AI chat.
                </p>
              </div>
            </section>

            {/* 4. WHERE DATA IS STORED */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">Where data is stored</h2>
              <div className="privacy-body">
                <ul className="privacy-list">
                  <li>
                    <strong>
                      User account, digests, settings, check-ins, project
                      summaries:
                    </strong>{" "}
                    stored in our Supabase database, scoped to your user ID.
                    Other users cannot read your data
                  </li>
                  <li>
                    <strong>Session:</strong> handled by NextAuth via an
                    HTTP-only cookie that holds your GitHub access token. The
                    cookie expires when your session does
                  </li>
                  <li>
                    <strong>API keys (LLM providers):</strong> held
                    server-side as environment variables. Never written to the
                    browser or shared with users
                  </li>
                </ul>
              </div>
            </section>

            {/* 5. DATA LOCATION AND INTERNATIONAL TRANSFERS */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">
                Data location and international transfers
              </h2>
              <div className="privacy-body">
                <p>
                  askScout is hosted on Vercel and uses Supabase for database
                  storage, both US-headquartered providers. If you sign up
                  from outside the United States, your data is transferred to
                  and processed in the United States. By using askScout you
                  consent to that transfer. We do not currently offer regional
                  data residency.
                </p>
              </div>
            </section>

            {/* 6. SECURITY */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">Security</h2>
              <div className="privacy-body">
                <ul className="privacy-list">
                  <li>
                    <strong>In transit:</strong> all traffic to askscout.dev,
                    the GitHub API, and the LLM provider runs over TLS
                  </li>
                  <li>
                    <strong>At rest:</strong> Supabase encrypts the database
                    at rest by default
                  </li>
                  <li>
                    <strong>Access control:</strong> every database row is
                    keyed to a user ID. Queries from the app server filter by
                    the signed-in user. There is no admin UI that lets one
                    user read another user&apos;s data
                  </li>
                  <li>
                    <strong>Secrets:</strong> LLM API keys and OAuth client
                    secrets live in server-side environment variables and are
                    never sent to the browser
                  </li>
                </ul>
              </div>
            </section>

            {/* 7. THIRD PARTIES */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">Third parties</h2>
              <div className="privacy-body">
                <p>
                  askScout uses the following services to operate. Each has
                  its own privacy policy:
                </p>
                <ul className="privacy-list">
                  <li>
                    <strong>GitHub:</strong> sign-in, repository access,
                    commit and diff fetches
                  </li>
                  <li>
                    <strong>Supabase:</strong> database hosting for the data
                    described above
                  </li>
                  <li>
                    <strong>Vercel:</strong> web hosting and edge delivery
                  </li>
                  <li>
                    <strong>An LLM provider</strong> (Anthropic or OpenAI,
                    depending on which API key the app is configured with).
                    Receives the commit / diff payload during digest
                    generation and returns the summary text
                  </li>
                </ul>
                <p>
                  We do not embed third-party analytics, advertising trackers,
                  or social-media pixels.
                </p>
              </div>
            </section>

            {/* 8. COOKIES */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">Cookies</h2>
              <div className="privacy-body">
                <p>
                  askScout sets one essential cookie, the NextAuth session
                  cookie, used solely to keep you signed in. It is HTTP-only
                  and Secure-flagged. We do not set marketing or analytics
                  cookies.
                </p>
              </div>
            </section>

            {/* 9. YOUR RIGHTS AND CONTROLS */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">
                Your rights and controls
              </h2>
              <div className="privacy-body">
                <ul className="privacy-list">
                  <li>
                    <strong>See your data:</strong> everything we have on you
                    is rendered in the app on the Dashboard, Insights, and
                    Settings pages
                  </li>
                  <li>
                    <strong>Clear individual digests:</strong> Settings →
                    Clear History (per repo or all at once)
                  </li>
                  <li>
                    <strong>Delete your account:</strong> Settings → Danger
                    Zone → Delete Account. This removes every record tied to
                    your user ID from our database. You&apos;ll need to sign
                    in with GitHub again to use askScout afterwards
                  </li>
                  <li>
                    <strong>Revoke GitHub access:</strong> at{" "}
                    <a
                      href="https://github.com/settings/applications"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      github.com/settings/applications
                    </a>
                    . This stops us from making any further reads but
                    doesn&apos;t delete data already stored. Use the
                    account-deletion option above to remove that
                  </li>
                </ul>
              </div>
            </section>

            {/* 10. RETENTION */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">Retention</h2>
              <div className="privacy-body">
                <p>
                  Digests, project summaries, settings, and check-ins are
                  retained as long as your account exists. They are deleted
                  when you clear them in-app or delete your account. We do not
                  keep backups of deleted user data beyond standard short-term
                  operational backups maintained by Supabase, which roll off
                  on their normal cycle.
                </p>
              </div>
            </section>

            {/* 11. DATA BREACH NOTIFICATION */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">
                Data breach notification
              </h2>
              <div className="privacy-body">
                <p>
                  If we learn of a personal-data breach that meaningfully
                  affects users, we will notify affected users by email within
                  72 hours of confirming the breach, in line with the GDPR
                  Article 33 timeline. The notice will describe what happened,
                  what data was affected, what we have done in response, and
                  what you can do.
                </p>
              </div>
            </section>

            {/* 12. REGIONAL RIGHTS (GDPR AND CCPA) */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">
                Regional rights (GDPR and CCPA)
              </h2>
              <div className="privacy-body">
                <p>
                  We offer the same set of in-app controls and email-based
                  requests to every user regardless of location. If you are in
                  the EU/UK or California, the rights described under
                  &quot;Your rights and controls&quot; (access, deletion,
                  correction, restriction of processing, data export) cover
                  the equivalent rights under GDPR and CCPA. We do not sell or
                  share personal data within the meaning of CCPA. Our legal
                  basis for processing under GDPR is performance of contract
                  (running the askScout service for you) and your consent at
                  sign-in.
                </p>
              </div>
            </section>

            {/* 13. CHILDREN */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">Children</h2>
              <div className="privacy-body">
                <p>
                  askScout is not directed at children under 13 and we do not
                  knowingly collect data from them. If you believe a child has
                  signed up, contact us and we will delete the account.
                </p>
              </div>
            </section>

            {/* 14. CHANGES TO THIS POLICY */}
            <section className="privacy-section">
              <h2 className="privacy-section-title">Changes to this policy</h2>
              <div className="privacy-body">
                <p>
                  If we change how data is handled in a meaningful way,
                  we&apos;ll update this page and change the &quot;last
                  updated&quot; date at the top. Material changes will be
                  surfaced in the app the next time you sign in.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>

      <ReadyCTA />
      <SiteFooter />
    </main>
  );
}
