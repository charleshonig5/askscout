import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Forward } from "lucide-react";
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
          <h2 className="home-section-title">A daily read on your code.</h2>
          <div className="home-bento">
            {/* 1. DAILY DIGEST — large, spans two columns. The bento's
                hero tile. Mock shows a streamed-section header + a
                couple of fake bullets so first-time readers see the
                product's actual output shape. */}
            <div className="home-bento-tile home-bento-tile--span-2 home-bento-tile--hero">
              <div className="home-bento-content">
                <p className="home-bento-eyebrow">Today</p>
                <h3 className="home-bento-title">What you actually shipped.</h3>
                <p className="home-bento-body">
                  Streams in plain English. Scout reads your commits and diffs and writes you
                  something worth reading.
                </p>
              </div>
              <div className="home-bento-mock home-bento-mock--digest" aria-hidden>
                <div className="home-bento-mock-section">
                  <span className="home-bento-mock-emoji">🚀</span>
                  <span className="home-bento-mock-section-label">Shipped</span>
                </div>
                <div className="home-bento-mock-bullet">
                  <strong>Sign in with Google</strong> - Users can finally log in without a
                  password.
                </div>
                <div className="home-bento-mock-bullet">
                  <strong>Settings page</strong> - Dark mode toggle and saved per-repo prefs.
                </div>
                <div className="home-bento-mock-section">
                  <span className="home-bento-mock-emoji">🔧</span>
                  <span className="home-bento-mock-section-label">Changed</span>
                </div>
                <div className="home-bento-mock-bullet">
                  <strong>Auth flow</strong> - Replaced the legacy session middleware.
                </div>
              </div>
            </div>

            {/* 2. STREAKS & HISTORY — medium. Mock shows a streak
                count + a 7-cell calendar strip with the last few
                days "filled." Communicates the daily-habit loop. */}
            <div className="home-bento-tile">
              <div className="home-bento-content">
                <p className="home-bento-eyebrow">Habit</p>
                <h3 className="home-bento-title">Don&apos;t break the chain.</h3>
                <p className="home-bento-body">
                  Every digest you generate builds your streak. Last 30 days saved per repo.
                </p>
              </div>
              <div className="home-bento-mock home-bento-mock--streak" aria-hidden>
                <div className="home-bento-mock-streak-count">
                  <Emoji name="streak" size={20} />
                  <span className="home-bento-mock-streak-num">23</span>
                  <span className="home-bento-mock-streak-label">day streak</span>
                </div>
                <div className="home-bento-mock-streak-calendar">
                  <span className="home-bento-mock-streak-cell home-bento-mock-streak-cell--on" />
                  <span className="home-bento-mock-streak-cell home-bento-mock-streak-cell--on" />
                  <span className="home-bento-mock-streak-cell home-bento-mock-streak-cell--on" />
                  <span className="home-bento-mock-streak-cell" />
                  <span className="home-bento-mock-streak-cell home-bento-mock-streak-cell--on" />
                  <span className="home-bento-mock-streak-cell home-bento-mock-streak-cell--on" />
                  <span className="home-bento-mock-streak-cell home-bento-mock-streak-cell--on" />
                </div>
              </div>
            </div>

            {/* 3. PERSONALITY — medium. Mock is a Fluent 3D archetype
                emoji + name + subheader. Echoes the actual insights
                page treatment so readers recognize it later. */}
            <div className="home-bento-tile">
              <div className="home-bento-content">
                <p className="home-bento-eyebrow">About you</p>
                <h3 className="home-bento-title">Find your archetype.</h3>
                <p className="home-bento-body">
                  The Marathoner. The Pirate. The Surgeon. Twenty-one ways Scout reads your work.
                </p>
              </div>
              <div className="home-bento-mock home-bento-mock--personality" aria-hidden>
                <Emoji name="marathoner" size={48} />
                <div className="home-bento-mock-personality-name">The Marathoner</div>
                <div className="home-bento-mock-personality-sub">
                  Active most weeks, low variance.
                </div>
              </div>
            </div>

            {/* 4. CODEBASE HEALTH — medium. Three horizontal bars
                Growth / Focus / Churn at varied fills. Mirrors the
                product's actual health-card visual. */}
            <div className="home-bento-tile">
              <div className="home-bento-content">
                <p className="home-bento-eyebrow">Signals</p>
                <h3 className="home-bento-title">Growth, focus, churn.</h3>
                <p className="home-bento-body">
                  Three indicators on every digest. See where you build, where you polish, and where
                  you keep coming back.
                </p>
              </div>
              <div className="home-bento-mock home-bento-mock--health" aria-hidden>
                <div className="home-bento-mock-health-row">
                  <span className="home-bento-mock-health-label">Growth</span>
                  <span className="home-bento-mock-health-bar">
                    <span
                      className="home-bento-mock-health-fill home-bento-mock-health-fill--good"
                      style={{ width: "78%" }}
                    />
                  </span>
                </div>
                <div className="home-bento-mock-health-row">
                  <span className="home-bento-mock-health-label">Focus</span>
                  <span className="home-bento-mock-health-bar">
                    <span
                      className="home-bento-mock-health-fill home-bento-mock-health-fill--good"
                      style={{ width: "62%" }}
                    />
                  </span>
                </div>
                <div className="home-bento-mock-health-row">
                  <span className="home-bento-mock-health-label">Churn</span>
                  <span className="home-bento-mock-health-bar">
                    <span
                      className="home-bento-mock-health-fill home-bento-mock-health-fill--mid"
                      style={{ width: "44%" }}
                    />
                  </span>
                </div>
              </div>
            </div>

            {/* 5. PACE CHECK — medium. Hero number "1.7×" with a
                short label. Echoes the actual pace card. */}
            <div className="home-bento-tile">
              <div className="home-bento-content">
                <p className="home-bento-eyebrow">Today vs you</p>
                <h3 className="home-bento-title">Above your usual.</h3>
                <p className="home-bento-body">
                  Today&apos;s commits compared to your rolling average. Calibrated to you, not some
                  industry baseline.
                </p>
              </div>
              <div className="home-bento-mock home-bento-mock--pace" aria-hidden>
                <span className="home-bento-mock-pace-num">1.7x</span>
                <span className="home-bento-mock-pace-label">Your normal pace</span>
              </div>
            </div>

            {/* 6. INSIGHTS — medium. Three stat rows mirroring the
                Snapshot card on the insights page. */}
            <div className="home-bento-tile">
              <div className="home-bento-content">
                <p className="home-bento-eyebrow">Patterns</p>
                <h3 className="home-bento-title">A read on your week.</h3>
                <p className="home-bento-body">
                  Best streak, total digests, your weekly pace, plus a per-repo breakdown. The big
                  picture you don&apos;t get from any single digest.
                </p>
              </div>
              <div className="home-bento-mock home-bento-mock--insights" aria-hidden>
                <div className="home-bento-mock-insight-row">
                  <span className="home-bento-mock-insight-label">Best streak</span>
                  <span className="home-bento-mock-insight-value">47 days</span>
                </div>
                <div className="home-bento-mock-insight-row">
                  <span className="home-bento-mock-insight-label">Total digests</span>
                  <span className="home-bento-mock-insight-value">231</span>
                </div>
                <div className="home-bento-mock-insight-row">
                  <span className="home-bento-mock-insight-label">Per week avg</span>
                  <span className="home-bento-mock-insight-value">5.2</span>
                </div>
              </div>
            </div>

            {/* 7. MANIFESTO — medium, clickable. Cover-style article
                tile linking to the Hidden Cost essay. Doubles as the
                "why this exists" beat that the dropped Problem
                section used to carry. */}
            <Link
              href="/articles/the-hidden-cost-of-vibe-coding"
              className="home-bento-tile home-bento-tile--link"
            >
              <div className="home-bento-content">
                <p className="home-bento-eyebrow">Why this exists</p>
                <h3 className="home-bento-title">The hidden cost of vibe coding.</h3>
                <p className="home-bento-body">
                  AI sped you up and made you forget what you built. Read the full piece.
                </p>
              </div>
              <div className="home-bento-mock home-bento-mock--manifesto" aria-hidden>
                <div className="home-bento-mock-article-tag">Article</div>
                <div className="home-bento-mock-article-meta">
                  Read time: 4 min
                  <Forward size={10} strokeWidth={1.5} aria-hidden />
                </div>
              </div>
            </Link>

            {/* 8. MULTI-OUTPUT — slim full-width strip across the
                whole grid. Three chips for Standup / Plan / Resume,
                framed as bonus uses of the same diff data. */}
            <div className="home-bento-tile home-bento-tile--full home-bento-tile--strip">
              <div className="home-bento-content home-bento-content--horizontal">
                <div>
                  <p className="home-bento-eyebrow">Same diffs, more uses</p>
                  <h3 className="home-bento-title">Standup. Plan. Resume Prompt.</h3>
                  <p className="home-bento-body">
                    Three extra outputs from the same data. A Slack standup, a tomorrow plan, and a
                    context block to paste into your AI.
                  </p>
                </div>
                <div className="home-bento-mock home-bento-mock--multi" aria-hidden>
                  <div className="home-bento-mock-output-chip">
                    <Emoji name="standup" size={16} />
                    <span>Standup</span>
                  </div>
                  <div className="home-bento-mock-output-chip">
                    <Emoji name="plan" size={16} />
                    <span>Plan</span>
                  </div>
                  <div className="home-bento-mock-output-chip">
                    <Emoji name="resume" size={16} />
                    <span>Resume Prompt</span>
                  </div>
                </div>
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
          <h2 className="home-section-title">There&apos;s a CLI too.</h2>
          <p className="home-section-prose-narrow">
            Same product, just on your machine. Runs in any git repo, brings your own LLM key, and
            pipes wherever you want. The only network call is the one to your provider. Nothing
            persists online.
          </p>
          <div className="home-split-tile home-split-tile--solo">
            <pre className="home-split-tile-code">
              <code>npm install -g askscout</code>
              <br />
              <code>askscout --setup</code>
              <br />
              <code>askscout</code>
            </pre>
            <div className="home-split-tile-cta">
              <Link href="/docs" className="home-cta home-cta--inline">
                Read the CLI docs →
              </Link>
            </div>
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
