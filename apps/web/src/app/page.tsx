import { redirect } from "next/navigation";
import Link from "next/link";
import { BookText, ChevronDown, Forward, ScrollText, Sparkles } from "lucide-react";
import { auth, signIn } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallChip } from "@/components/InstallChip";
import { HeroStars } from "@/components/HeroStars";
import { Emoji } from "@/components/Emoji";
import { MOCK_STREAMING_TEXT } from "@/lib/mock-data";

export default async function LandingPage() {
  const session = await auth();

  // If already logged in, go straight to the dashboard.
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="home">
      {/* ===========================================================
          NAV — minimal top bar with section anchors + theme toggle.
          Sticky-ish behavior is handled by the page scroll, not the
          element — keeps it lightweight and avoids overlap with the
          hero. =========================================================== */}
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

      {/* ===========================================================
          HERO — the first 100vh of the page. Wordmark, tagline, the
          primary CTA with its orbital star animation, and the
          streaming digest demo card sitting beneath. Everything
          centers on the page's content axis. =========================================================== */}
      <section className="home-hero">
        <HeroStars />
        <div className="home-hero-inner">
          <p className="home-hero-eyebrow">The daily digest for vibe coders</p>
          <h1 className="home-hero-title">
            Remember what you <em>actually</em> shipped.
          </h1>
          <p className="home-hero-subtitle">
            AI wrote half your code this week. By Friday, half of that is a blur. askscout reads
            your repo and writes you a plain-English digest of what you actually shipped, what
            changed, and where to pick back up.
          </p>
          <div className="home-hero-cta">
            <div className="home-cta-row">
              {/* Primary CTA: web app sign-in. Orbital star traces
                  the perimeter via offset-path, plays into the
                  Scout brand metaphor without adding brand color. */}
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/dashboard" });
                }}
              >
                <button type="submit" className="home-cta home-cta--orbital">
                  <span className="home-cta-label">Try askscout free</span>
                  <span className="home-cta-orbit" aria-hidden />
                </button>
              </form>
              {/* Secondary CTA: install command chip. One click copies
                  `npm install -g askscout` to the clipboard. Power
                  users skip the sign-in flow entirely. */}
              <InstallChip />
            </div>
            {/* Trust chips — three small pills sitting below the CTA row.
                "Open source" is a link out to the repo so security-
                conscious readers can verify the read-only / diffs-only
                claims directly in code. The other two are static
                badges. Free / no credit card lives on the CTA button
                copy + the final CTA section, so it's not duplicated
                here. */}
            <div className="home-hero-chips">
              <a
                href="https://github.com/charleshonig5/askscout"
                target="_blank"
                rel="noopener noreferrer"
                className="home-hero-chip home-hero-chip--link"
              >
                Open source
                <Forward size={10} strokeWidth={1.5} aria-hidden />
              </a>
              <span className="home-hero-chip">Read-only</span>
              <span className="home-hero-chip">No source code</span>
            </div>
          </div>
        </div>

        {/* Demo card — non-interactive preview of a streaming digest
            so first-time visitors immediately see what the product
            output looks like. Uses MOCK_STREAMING_TEXT (the same
            preview string the dashboard skeleton uses). */}
        <div className="home-hero-demo" aria-hidden>
          <div className="home-hero-demo-chrome">
            <span className="home-hero-demo-dot" />
            <span className="home-hero-demo-dot" />
            <span className="home-hero-demo-dot" />
            <span className="home-hero-demo-label">today&apos;s digest</span>
          </div>
          <pre className="home-hero-demo-body">{MOCK_STREAMING_TEXT}</pre>
        </div>
      </section>

      {/* ===========================================================
          BENTO — features showcase. Eight tiles in a 4-column grid.
          The "Daily digest" tile spans two columns and acts as the
          hero of the bento; the four medium tiles fill the second
          row; "Multi-output" is a slim full-width strip at the
          bottom. Each tile has a tiny visual mock, not just text,
          so the section reads as a product surface rather than a
          paragraph wall.
          =========================================================== */}
      <section className="home-section">
        <div className="home-section-inner">
          <p className="home-eyebrow">What you get</p>
          <h2 className="home-section-title">A daily read on your code, in plain English.</h2>
          <div className="home-bento">
            {/* 1. THE READ — your daily recap. Mock shows a streamed
                digest section + a couple of fake bullets so readers
                see the product's actual output shape on first scan. */}
            <div className="home-bento-tile">
              <div className="home-bento-content">
                <p className="home-bento-eyebrow">Today</p>
                <h3 className="home-bento-title">Your daily recap.</h3>
                <p className="home-bento-body">
                  A plain-English read on what you shipped, changed, and where you left off. Six
                  sections, same shape every day.
                </p>
              </div>
              <div className="home-bento-mock home-bento-mock--scaled" aria-hidden>
                {/* Real digest section DOM — same classes the dashboard
                    uses (`.digest-bulleted`, `.digest-bulleted-heading`,
                    `.digest-item-bullet/title/context`). What you see
                    here is what the live digest renders, just shrunk
                    via the .home-bento-mock--scaled wrapper. */}
                <div className="digest-bulleted">
                  <div className="digest-bulleted-header">
                    <div className="digest-bulleted-heading">
                      <Emoji name="shipped" size={20} />
                      <span className="digest-bulleted-label">Shipped</span>
                    </div>
                  </div>
                  <div className="digest-bulleted-list">
                    <div className="digest-item">
                      <span className="digest-item-bullet" aria-hidden />
                      <p className="digest-item-text">
                        <span className="digest-item-title">Sign in with Google</span>
                        {" - "}
                        <span className="digest-item-context">
                          Users can log in without a password.
                        </span>
                      </p>
                    </div>
                    <div className="digest-item">
                      <span className="digest-item-bullet" aria-hidden />
                      <p className="digest-item-text">
                        <span className="digest-item-title">Settings page</span>
                        {" - "}
                        <span className="digest-item-context">
                          Dark mode + saved per-repo prefs.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="digest-bulleted">
                  <div className="digest-bulleted-header">
                    <div className="digest-bulleted-heading">
                      <Emoji name="changed" size={20} />
                      <span className="digest-bulleted-label">Changed</span>
                    </div>
                  </div>
                  <div className="digest-bulleted-list">
                    <div className="digest-item">
                      <span className="digest-item-bullet" aria-hidden />
                      <p className="digest-item-text">
                        <span className="digest-item-title">Auth flow</span>
                        {" - "}
                        <span className="digest-item-context">
                          Replaced legacy session middleware.
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CUSTOMIZE — toggle every digest section, pin a
                default repo, manage history. Mock is a settings-style
                row of toggles in mixed states so readers see the
                control directly. */}
            <div className="home-bento-tile">
              <div className="home-bento-content">
                <p className="home-bento-eyebrow">Yours</p>
                <h3 className="home-bento-title">Customize your digest.</h3>
                <p className="home-bento-body">
                  Toggle every section on or off. Pin a default repo. Clear history per repo or all
                  at once.
                </p>
              </div>
              <div
                className="home-bento-mock settings-panel settings-panel--toggles"
                aria-hidden
              >
                {/* Real settings toggle DOM — same classes the
                    /settings page uses (`.settings-toggle-row`,
                    `.settings-toggle-info`, `.settings-switch` with
                    track + thumb). Inputs are disabled + tabIndex
                    -1 so the marketing tile stays non-interactive. */}
                <div className="settings-toggle-row">
                  <div className="settings-toggle-info">
                    <span className="settings-toggle-label">Vibe Check</span>
                    <span className="settings-toggle-desc">Casual overview of your day</span>
                  </div>
                  <label className="settings-switch">
                    <input type="checkbox" defaultChecked tabIndex={-1} disabled />
                    <span className="settings-switch-track" />
                    <span className="settings-switch-thumb" />
                  </label>
                </div>
                <hr className="settings-row-divider" aria-hidden />
                <div className="settings-toggle-row">
                  <div className="settings-toggle-info">
                    <span className="settings-toggle-label">Shipped</span>
                    <span className="settings-toggle-desc">New features and functionality</span>
                  </div>
                  <label className="settings-switch">
                    <input type="checkbox" defaultChecked tabIndex={-1} disabled />
                    <span className="settings-switch-track" />
                    <span className="settings-switch-thumb" />
                  </label>
                </div>
                <hr className="settings-row-divider" aria-hidden />
                <div className="settings-toggle-row">
                  <div className="settings-toggle-info">
                    <span className="settings-toggle-label">Codebase Health</span>
                    <span className="settings-toggle-desc">Growth, focus, and churn</span>
                  </div>
                  <label className="settings-switch">
                    <input type="checkbox" defaultChecked tabIndex={-1} disabled />
                    <span className="settings-switch-track" />
                    <span className="settings-switch-thumb" />
                  </label>
                </div>
                <hr className="settings-row-divider" aria-hidden />
                <div className="settings-toggle-row">
                  <div className="settings-toggle-info">
                    <span className="settings-toggle-label">Pace Check</span>
                    <span className="settings-toggle-desc">Today vs your rolling average</span>
                  </div>
                  <label className="settings-switch">
                    <input type="checkbox" tabIndex={-1} disabled />
                    <span className="settings-switch-track" />
                    <span className="settings-switch-thumb" />
                  </label>
                </div>
              </div>
            </div>

            {/* 3. HISTORY — 30-day archive per repo + streaks. Mock
                is the streak count + 7-cell calendar strip from the
                actual sidebar treatment. */}
            <div className="home-bento-tile">
              <div className="home-bento-content">
                <p className="home-bento-eyebrow">History</p>
                <h3 className="home-bento-title">Built-in history.</h3>
                <p className="home-bento-body">
                  Every digest is saved for thirty days per repo. Streaks build, quiet days still
                  count, every read one click away.
                </p>
              </div>
              <div className="home-bento-mock home-bento-mock--history" aria-hidden>
                {/* Real streak chip — same `.digest-streak` class the
                    dashboard header uses, with the same Fluent fire
                    Emoji at the same size (14px) the live product
                    renders. Plus a strip of real `.insights-calendar-cell`
                    elements in their active/empty/checkin states from
                    the insights activity grid. */}
                <span className="digest-streak">
                  <Emoji name="streak" size={14} /> 23 Day Streak
                </span>
                <div className="home-bento-mock-cal-row">
                  <span className="insights-calendar-cell" data-state="active" />
                  <span className="insights-calendar-cell" data-state="active" />
                  <span className="insights-calendar-cell" data-state="active" />
                  <span className="insights-calendar-cell" data-state="checkin" />
                  <span className="insights-calendar-cell" data-state="active" />
                  <span className="insights-calendar-cell" data-state="active" />
                  <span className="insights-calendar-cell" data-state="active" />
                </div>
              </div>
            </div>

            {/* 4. OUTPUTS — three more outputs derived from the same
                digest. Mock shows the three product chips users see
                in the dashboard. */}
            <div className="home-bento-tile">
              <div className="home-bento-content">
                <p className="home-bento-eyebrow">Outputs</p>
                <h3 className="home-bento-title">Three more outputs.</h3>
                <p className="home-bento-body">
                  Pulled from the same digest. Paste the standup into Slack, the to-do list into
                  your tracker, the resume prompt into your AI.
                </p>
              </div>
              <div className="home-bento-mock home-bento-mock--actions" aria-hidden>
                {/* Real action-button DOM — same `.standup-btn` class
                    + same Lucide icons (BookText, ScrollText,
                    Sparkles) the dashboard's bottom-action row and
                    the Resume Prompt button render. Disabled +
                    tabIndex -1 so the marketing tile is purely
                    visual. */}
                <button type="button" className="standup-btn" tabIndex={-1} disabled>
                  <BookText size={20} strokeWidth={1} aria-hidden />
                  Generate Standup
                </button>
                <button type="button" className="standup-btn" tabIndex={-1} disabled>
                  <ScrollText size={20} strokeWidth={1} aria-hidden />
                  Generate Todo List
                </button>
                <button type="button" className="standup-btn" tabIndex={-1} disabled>
                  <Sparkles size={20} strokeWidth={1} aria-hidden />
                  Resume Prompt
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================================
          PREFER LOCAL — CLI section. By the time the reader reaches
          this point the bento grid has covered the web-app surface,
          so this section exists for users who want it local. Single
          tile, BYOK framing. =========================================================== */}
      <section className="home-section">
        <div className="home-section-inner home-section-inner--narrow">
          <p className="home-eyebrow">Want it local?</p>
          <h2 className="home-section-title">Run it locally.</h2>
          <p className="home-section-prose-narrow">
            Same product, as a CLI on your machine. Bring your own LLM key. Always stays fully
            local.
          </p>
          <div className="home-terminal" role="img" aria-label="askscout running in a terminal">
            <div className="home-terminal-chrome">
              <span className="home-terminal-dot home-terminal-dot--red" />
              <span className="home-terminal-dot home-terminal-dot--yellow" />
              <span className="home-terminal-dot home-terminal-dot--green" />
              <span className="home-terminal-title">askscout</span>
            </div>
            <pre className="home-terminal-body">
              <span className="home-terminal-prompt">$</span> askscout
              {"\n\n"}
              <span className="home-terminal-heading">
                🔍 Scout scanned askscout
              </span>
              {"\n"}
              <span className="home-terminal-dim">
                {"   "}12 commits · 23 files · today
              </span>
              {"\n\n"}
              <span className="home-terminal-heading">💬 Vibe Check</span>
              {"\n"}
              You shipped the bento grid and tightened the{"\n"}
              homepage copy. Strong forward motion.
              {"\n\n"}
              <span className="home-terminal-dim">
                {"   "}+1,284 lines · -612 lines · 12 commits · 23 files
              </span>
              {"\n\n"}
              <span className="home-terminal-heading">🚀 Shipped  3</span>
              {"\n"}
              {"  "}• Bento: render real product DOM inside each tile{"\n"}
              {"  "}• Marketing: pare bento to four pillar tiles{"\n"}
              {"  "}• Marketing/docs: align copy with product behavior
              {"\n\n"}
              <span className="home-terminal-heading">📋 Left Off  1</span>
              {"\n"}
              {"  "}• Mid-edit on the CLI section subheader copy
              {"\n\n"}
              <span className="home-terminal-prompt">$</span>{" "}
              <span className="home-terminal-cursor" aria-hidden>
                █
              </span>
            </pre>
          </div>
          <div className="home-cli-cta">
            <Link href="/docs" className="home-cta home-cta--inline">
              Read the CLI docs →
            </Link>
          </div>
        </div>
      </section>

      {/* ===========================================================
          PRIVACY — short, declarative. One paragraph + link to the
          full policy. Not a section that needs to overwhelm. =========================================================== */}
      <section className="home-section home-section--quiet">
        <div className="home-section-inner home-section-inner--narrow">
          <p className="home-eyebrow">Privacy</p>
          <h2 className="home-section-title">
            Read-only. Diffs only.
            <br />
            Never your secrets.
          </h2>
          <p className="home-section-prose-narrow">
            askscout reads commit messages and diffs. That&apos;s it. No source files, no env vars,
            no anything-not-in-a-commit. The web app keeps your digests under your GitHub user. The
            CLI keeps nothing online.{" "}
            <Link href="/privacy" className="home-prose-link">
              Read the full policy →
            </Link>
          </p>
        </div>
      </section>

      {/* ===========================================================
          ARTICLES — preview strip pointing readers to the writing.
          One feature card today (the manifesto) since that's the
          only published article; the layout is built as a row that
          scales to two or three cards once more pieces ship. The
          all-articles link sits at the section head so readers can
          jump straight to the index. The FAQ section follows in the
          next step.
          =========================================================== */}
      <section className="home-section">
        <div className="home-section-inner">
          <div className="home-articles-head">
            <div>
              <p className="home-eyebrow">Writing</p>
              <h2 className="home-section-title">More from Scout.</h2>
            </div>
            <Link href="/articles" className="home-articles-link">
              All articles
              <Forward size={10} strokeWidth={1.5} aria-hidden />
            </Link>
          </div>
          <div className="home-articles-row">
            <Link
              href="/articles/the-hidden-cost-of-vibe-coding"
              className="home-article-card"
            >
              <span className="home-article-card-tag">Article</span>
              <h3 className="home-article-card-title">The Hidden Cost of Vibe Coding</h3>
              <p className="home-article-card-excerpt">
                AI coding tools sped us up. They also made it harder to remember what we built.
                Why the next big workflow problem is digesting your own code.
              </p>
              <span className="home-article-card-meta">
                Read time: 4 min
                <Forward size={10} strokeWidth={1.5} aria-hidden />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===========================================================
          FAQ — accordion built with native <details>/<summary> so
          it's accessible and SSR-clean without any client JS. Each
          item collapses on load. Sits between Articles and the
          Final CTA so any last-mile objections get cleared right
          before the second sign-in button.
          =========================================================== */}
      <section className="home-section home-section--quiet">
        <div className="home-section-inner home-section-inner--narrow">
          <p className="home-eyebrow">Questions</p>
          <h2 className="home-section-title">Things people ask.</h2>
          <div className="home-faq">
            <details className="home-faq-item">
              <summary className="home-faq-question">
                <span>Does Scout read my source code?</span>
                <ChevronDown size={16} strokeWidth={1.5} className="home-faq-chevron" aria-hidden />
              </summary>
              <div className="home-faq-answer">
                <p>
                  No. Scout reads commit messages and diffs, which are the lines added and removed
                  in each commit. Source files, env vars, secrets, and build artifacts never get
                  touched.
                </p>
              </div>
            </details>

            <details className="home-faq-item">
              <summary className="home-faq-question">
                <span>What does &ldquo;read-only&rdquo; mean exactly?</span>
                <ChevronDown size={16} strokeWidth={1.5} className="home-faq-chevron" aria-hidden />
              </summary>
              <div className="home-faq-answer">
                <p>
                  The OAuth scope we request is <code>read:user repo</code>. That gives Scout
                  permission to read your profile and your repositories. We never write, modify, or
                  delete anything in any repo.
                </p>
              </div>
            </details>

            <details className="home-faq-item">
              <summary className="home-faq-question">
                <span>How much does it cost?</span>
                <ChevronDown size={16} strokeWidth={1.5} className="home-faq-chevron" aria-hidden />
              </summary>
              <div className="home-faq-answer">
                <p>
                  The web app is free. There&apos;s a soft cap at 30 digests per day across your
                  account to keep API costs sane, which is plenty for a daily reader. The CLI is
                  free too. With the CLI you bring your own LLM API key, which runs about $0.001
                  to $0.003 per digest.
                </p>
              </div>
            </details>

            <details className="home-faq-item">
              <summary className="home-faq-question">
                <span>Does this work for private repos?</span>
                <ChevronDown size={16} strokeWidth={1.5} className="home-faq-chevron" aria-hidden />
              </summary>
              <div className="home-faq-answer">
                <p>
                  Yes. As long as you grant access during sign-in, Scout can generate digests for
                  any repo on your account, public or private.
                </p>
              </div>
            </details>

            <details className="home-faq-item">
              <summary className="home-faq-question">
                <span>Can I delete my data?</span>
                <ChevronDown size={16} strokeWidth={1.5} className="home-faq-chevron" aria-hidden />
              </summary>
              <div className="home-faq-answer">
                <p>
                  Yes. Settings &rarr; Danger Zone &rarr; Delete Account removes every record tied
                  to your user ID. You can also clear individual repo histories without deleting
                  your account.
                </p>
              </div>
            </details>

            <details className="home-faq-item">
              <summary className="home-faq-question">
                <span>Why GitHub OAuth and not API keys?</span>
                <ChevronDown size={16} strokeWidth={1.5} className="home-faq-chevron" aria-hidden />
              </summary>
              <div className="home-faq-answer">
                <p>
                  GitHub OAuth means you never have to manage tokens. Scout never sees your
                  password. You can revoke access any time at{" "}
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
            </details>

            <details className="home-faq-item">
              <summary className="home-faq-question">
                <span>What happens if I clear my history?</span>
                <ChevronDown size={16} strokeWidth={1.5} className="home-faq-chevron" aria-hidden />
              </summary>
              <div className="home-faq-answer">
                <p>
                  Past digests get deleted from our database. Your streak count and personality
                  archetype recompute from whatever digests are still on file. Clearing history
                  doesn&apos;t sign you out or revoke GitHub access.
                </p>
              </div>
            </details>

            <details className="home-faq-item">
              <summary className="home-faq-question">
                <span>Who built this and why?</span>
                <ChevronDown size={16} strokeWidth={1.5} className="home-faq-chevron" aria-hidden />
              </summary>
              <div className="home-faq-answer">
                <p>
                  Charles Honig built askscout because AI coding tools made him forget what he
                  shipped.{" "}
                  <Link
                    href="/articles/the-hidden-cost-of-vibe-coding"
                    className="home-prose-link"
                  >
                    Read the full piece
                  </Link>{" "}
                  for the longer version.
                </p>
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* ===========================================================
          FINAL CTA — the second-and-last sign-in button on the
          page. Same orbital star treatment so it reads as
          consistent with the hero. =========================================================== */}
      <section className="home-section home-section--cta">
        <div className="home-section-inner">
          <h2 className="home-section-title home-section-title--cta">
            Stop forgetting what you shipped.
          </h2>
          <div className="home-final-cta">
            <div className="home-cta-row">
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/dashboard" });
                }}
              >
                <button type="submit" className="home-cta home-cta--orbital">
                  <span className="home-cta-label">Try askscout free</span>
                  <span className="home-cta-orbit" aria-hidden />
                </button>
              </form>
              <InstallChip />
            </div>
            <p className="home-hero-meta">Free. No credit card. No tracking.</p>
          </div>
        </div>
      </section>

      {/* ===========================================================
          FOOTER — minimal. Wordmark, three nav columns, copyright.
          =========================================================== */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-brand">
            <span className="home-footer-logo">askscout</span>
            <span className="home-footer-tagline">The daily digest for vibe coders.</span>
          </div>
          <div className="home-footer-cols">
            <div className="home-footer-col">
              <span className="home-footer-col-title">Product</span>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/docs">Docs</Link>
            </div>
            <div className="home-footer-col">
              <span className="home-footer-col-title">Read</span>
              <Link href="/articles">Articles</Link>
              <Link href="/articles/the-hidden-cost-of-vibe-coding">
                Hidden Cost of Vibe Coding
              </Link>
            </div>
            <div className="home-footer-col">
              <span className="home-footer-col-title">Legal</span>
              <Link href="/privacy">Privacy</Link>
              <a
                href="https://github.com/charleshonig5/askscout"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
        <div className="home-footer-copy">© 2026 askscout</div>
      </footer>
    </main>
  );
}
