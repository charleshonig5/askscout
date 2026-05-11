import Link from "next/link";
import {
  BookText,
  Code2,
  EyeOff,
  Forward,
  LayoutList,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { signIn } from "@/auth";
import { InstallChip } from "@/components/InstallChip";
import { HeroStars } from "@/components/HeroStars";
import { Emoji } from "@/components/Emoji";
import FAQTabs from "@/components/FAQTabs";
import { MarketingNav } from "@/components/MarketingNav";
import { SiteFooter } from "@/components/SiteFooter";
import { FAQ_PLAIN } from "@/lib/faq-data";
import { MOCK_STREAMING_TEXT } from "@/lib/mock-data";

/* JSON-LD FAQPage schema generated from FAQ_PLAIN so the structured
   data stays in lockstep with the rendered tabbed FAQ. Google
   requires the answer text in schema to mirror what users see on
   the page. */
const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_PLAIN.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function MarketingHome() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
    <main className="home">
      {/* ===========================================================
          NAV — minimal top bar with section anchors + theme toggle.
          Sticky-ish behavior is handled by the page scroll, not the
          element — keeps it lightweight and avoids overlap with the
          hero. =========================================================== */}
      <MarketingNav />

      {/* ===========================================================
          HERO — the first 100vh of the page. Wordmark, tagline, the
          primary CTA with its orbital star animation, and the
          streaming digest demo card sitting beneath. Everything
          centers on the page's content axis. =========================================================== */}
      <section className="home-hero">
        <HeroStars />
        <div className="home-hero-inner">
          <div className="home-hero-text-stack">
            <div className="home-hero-headline">
              {/* Trust chips sit ABOVE the title per Figma 244:2426.
                  Two chips only (was three). "Open Source" is a link
                  to the repo so security-conscious readers can verify
                  the claims directly in code. */}
              <div className="home-hero-chips">
                <a
                  href="https://github.com/charleshonig5/askscout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="home-hero-chip home-hero-chip--link"
                >
                  Open Source
                  <Forward size={10} strokeWidth={1.5} aria-hidden />
                </a>
                <span className="home-hero-chip">Read Only</span>
              </div>
              {/* Pridi title with mixed weights — "Your morning" and
                  "in 10 seconds" render at ExtraLight (200), while
                  "code briefing" stays at Regular (400) for emphasis.
                  52px / 60 line-height per Figma. */}
              <h1 className="home-hero-title">
                <span className="home-hero-title-light">Your morning</span>{" "}
                code briefing{" "}
                <span className="home-hero-title-light">in 10 seconds</span>
              </h1>
            </div>
            <p className="home-hero-subtitle">
              A daily digest of your code in plain language so you can pick up exactly where
              you left off.
            </p>
          </div>
          <div className="home-hero-cta">
            {/* Primary CTA: web-app sign-in. Plain bordered button —
                the previous orbital animation isn't part of the new
                Figma direction. */}
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <button type="submit" className="home-cta">
                Try AskScout Free
              </button>
            </form>
            {/* Secondary CTA: install command chip. One click copies
                `npm install -g askscout` to the clipboard. */}
            <InstallChip />
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
                <p className="home-bento-eyebrow">AI Resume Prompt</p>
                <h3 className="home-bento-title">Pick up where you left off.</h3>
                <p className="home-bento-body">
                  Paste the AI Resume Prompt into your AI coding tool. Lets you pick up your
                  project on a new session without you explaining it.
                </p>
              </div>
              <div className="home-bento-mock home-bento-mock--actions" aria-hidden>
                {/* Real action-button DOM — same `.standup-btn` class
                    + same Lucide icons (BookText, LayoutList,
                    Sparkles) the dashboard's bottom-action row and
                    the Resume Prompt button render. Disabled +
                    tabIndex -1 so the marketing tile is purely
                    visual. */}
                <button type="button" className="standup-btn" tabIndex={-1} disabled>
                  <BookText size={20} strokeWidth={1} aria-hidden />
                  Generate Standup
                </button>
                <button type="button" className="standup-btn" tabIndex={-1} disabled>
                  <LayoutList size={20} strokeWidth={1} aria-hidden />
                  Generate Todo List
                </button>
                <button type="button" className="standup-btn" tabIndex={-1} disabled>
                  <Sparkles size={20} strokeWidth={1} aria-hidden />
                  AI Resume Prompt
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
        <div className="home-section-inner home-section-inner--narrow home-section-inner--align-left">
          <p className="home-eyebrow">Want it local?</p>
          <h2 className="home-section-title">Run it locally.</h2>
          <p className="home-section-prose-narrow">
            Same product, as a CLI on your machine. Bring your own LLM key. Always stays fully
            local.
          </p>
          <div className="home-terminal" role="img" aria-label="AskScout running in a terminal">
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
                🔍 Scout scanned acme-app
              </span>
              {"\n"}
              <span className="home-terminal-dim">
                {"   "}12 commits · 23 files · today
              </span>
              {"\n\n"}
              <span className="home-terminal-heading">💬 Vibe Check</span>
              {"\n"}
              Cancel flow shipped, onboarding v2 polished.{"\n"}
              The billing pipeline finally hangs together.
              {"\n\n"}
              <span className="home-terminal-dim">
                {"   "}+1,284 lines · -612 lines · 12 commits · 23 files
              </span>
              {"\n\n"}
              <span className="home-terminal-heading">🚀 Shipped  3</span>
              {"\n"}
              {"  "}• Stripe cancel webhook handles renewals and bounces{"\n"}
              {"  "}• Onboarding v2 with progress bar and resume drafts{"\n"}
              {"  "}• Verification emails retry on transient SMTP failures
              {"\n\n"}
              <span className="home-terminal-heading">🔧 Changed  2</span>
              {"\n"}
              {"  "}• Search uses a composite index now, queries under 20ms{"\n"}
              {"  "}• Sign-out syncs across browser tabs via BroadcastChannel
              {"\n\n"}
              <span className="home-terminal-heading">📍 Left Off  1</span>
              {"\n"}
              {"  "}• Invitation email template shows null for some org names
              {"\n\n"}
              <span className="home-terminal-heading">🔑 Key Takeaways</span>
              {"\n"}
              Billing is in shape. Next move is fixing the org-name lookup{"\n"}
              before the team-invite email goes live.
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
          TRUST — three pillars (privacy, open source, security)
          that compound credibility. Each card title is a plain
          claim a non-technical reader can grok; body backs it
          with verifiable specifics grounded in the actual repo
          (github.ts read endpoints, MIT license across all
          packages, chmod 600 on CLI key file). =========================================================== */}
      <section className="home-section home-section--quiet">
        <div className="home-section-inner">
          <p className="home-eyebrow">Trust</p>
          <h2 className="home-section-title">Private. Secure. Open.</h2>
          <p className="home-section-prose-narrow">
            You stay in control of your code, your keys, and your data.{" "}
            <Link href="/privacy" className="home-prose-link">
              Read the full privacy policy →
            </Link>
          </p>
          <div className="home-trust-grid">
            <article className="home-trust-card">
              <span className="home-trust-icon" aria-hidden>
                <EyeOff size={20} strokeWidth={1.5} />
              </span>
              <h3 className="home-trust-title">We don&apos;t see your code.</h3>
              <p className="home-trust-body">
                Scout reads what changed in your repo and just enough surrounding context to
                interpret each change. Never your full files, your secrets, or your build
                artifacts.
              </p>
            </article>
            <article className="home-trust-card">
              <span className="home-trust-icon" aria-hidden>
                <ShieldCheck size={20} strokeWidth={1.5} />
              </span>
              <h3 className="home-trust-title">Your data stays safe.</h3>
              <p className="home-trust-body">
                Your keys stay private on your machine. Scout can never write to your repo. No
                tracking, ever.
              </p>
            </article>
            <article className="home-trust-card">
              <span className="home-trust-icon" aria-hidden>
                <Code2 size={20} strokeWidth={1.5} />
              </span>
              <h3 className="home-trust-title">Nothing is hidden.</h3>
              <p className="home-trust-body">
                Every line of Scout is public on GitHub. Free to read, fork, or build on.
              </p>
              <a
                href="https://github.com/charleshonig5/askscout"
                target="_blank"
                rel="noreferrer"
                className="home-trust-link"
              >
                View on GitHub
                <Forward size={10} strokeWidth={1.5} aria-hidden />
              </a>
            </article>
          </div>
        </div>
      </section>

      {/* ===========================================================
          ARTICLES — preview strip pointing readers to the writing.
          One feature card today (The Hidden Cost of Vibe Coding)
          since that's the lead piece; the layout is built as a row
          that scales to two or three cards once more pieces ship.
          The all-articles link sits at the section head so readers
          can jump straight to the index. The FAQ section follows in
          the
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
          <h2 className="home-section-title">Frequently asked questions.</h2>
          <FAQTabs />
        </div>
      </section>

      {/* ===========================================================
          FINAL CTA — the second-and-last sign-in button on the
          page. Same orbital star treatment so it reads as
          consistent with the hero. =========================================================== */}
      <section className="home-section home-section--cta">
        <div className="home-section-inner">
          <h2 className="home-section-title home-section-title--cta">
            Get your first digest now.
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
                  <span className="home-cta-label">Try AskScout free</span>
                  <span className="home-cta-orbit" aria-hidden />
                </button>
              </form>
              <InstallChip />
            </div>
            <p className="home-hero-meta">Free. No credit card. No tracking.</p>
          </div>
        </div>
      </section>

      {/* Footer — extracted to SiteFooter so every public page renders
          the same brand block, wordmark, socials, and theme toggle. */}
      <SiteFooter />
    </main>
    </>
  );
}
