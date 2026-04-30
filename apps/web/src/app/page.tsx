import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signIn } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallChip } from "@/components/InstallChip";
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
        <div className="home-hero-inner">
          <p className="home-hero-eyebrow">The daily digest for vibe coders</p>
          <h1 className="home-hero-title">
            Remember what you <em>actually</em> shipped.
          </h1>
          <p className="home-hero-subtitle">
            You ship 200 commits a week with your AI coding tools. By Friday you can&apos;t remember
            what you actually built. askscout reads your git history and tells you, in plain
            English, what shipped, what changed, and where you left off.
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
            <p className="home-hero-meta">
              Free. Read-only. Sign in with GitHub. We never see your source code.
            </p>
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
          PROBLEM — short, scenario-based. The point of this section
          is to make the reader feel the cost in their own week.
          =========================================================== */}
      <section className="home-section home-section--quiet">
        <div className="home-section-inner">
          <p className="home-eyebrow">The problem</p>
          <h2 className="home-section-title">
            AI coding tools made you faster.
            <br />
            They also made you forget.
          </h2>
          <div className="home-section-prose">
            <p>
              Friday afternoon. You close your laptop. Your teammate asks what you built this week.
              You stare at them. You pause for a second too long.
            </p>
            <p>
              <code className="home-inline-code">git log</code> is unreadable at this volume. Linear
              and Jira track plans, not actual built work. And asking the AI to summarize means
              pasting in diffs by hand every day.
            </p>
            <p>
              Vibe coding needs vibe digesting.{" "}
              <Link href="/articles/the-hidden-cost-of-vibe-coding" className="home-prose-link">
                Read the full essay →
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ===========================================================
          HOW IT WORKS — three tiles. Sign in / generate / read.
          Each tile gets a number, a short title, and one line of
          prose. Visual rhythm > information density. =========================================================== */}
      <section className="home-section">
        <div className="home-section-inner">
          <p className="home-eyebrow">How it works</p>
          <h2 className="home-section-title">Three steps. One ritual.</h2>
          <div className="home-steps">
            <div className="home-step">
              <span className="home-step-num">01</span>
              <h3 className="home-step-title">Connect your repo</h3>
              <p className="home-step-text">
                Sign in with GitHub on the web, or run <code>askscout</code> in any local repo with
                your own LLM API key.
              </p>
            </div>
            <div className="home-step">
              <span className="home-step-num">02</span>
              <h3 className="home-step-title">Get your digest</h3>
              <p className="home-step-text">
                askscout reads commits and diffs, summarizes them in plain English, and streams the
                result to you in seconds.
              </p>
            </div>
            <div className="home-step">
              <span className="home-step-num">03</span>
              <h3 className="home-step-title">Read your day</h3>
              <p className="home-step-text">
                Vibe Check, what shipped, what changed, what kept shifting, where you left off. Copy
                it into Slack or use it as your standup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================================
          DIGEST ANATOMY — explains what's actually in a digest. Six
          tile grid for the major sections, mirrored from the actual
          product output. Lets readers see the breadth before they
          sign up. =========================================================== */}
      <section className="home-section home-section--quiet">
        <div className="home-section-inner">
          <p className="home-eyebrow">What&apos;s in a digest</p>
          <h2 className="home-section-title">Built like a daily report.</h2>
          <p className="home-section-deck">
            Every digest reads top-to-bottom like a thoughtful engineer wrote it for you. Six
            sections, in a consistent order, every time.
          </p>
          <div className="home-grid">
            <div className="home-tile">
              <h3 className="home-tile-title">Vibe Check</h3>
              <p className="home-tile-text">
                One-line read on the day&apos;s work. Sets the tone before the details.
              </p>
            </div>
            <div className="home-tile">
              <h3 className="home-tile-title">Shipped</h3>
              <p className="home-tile-text">
                The features that actually made it into the codebase, not just attempts.
              </p>
            </div>
            <div className="home-tile">
              <h3 className="home-tile-title">Changed</h3>
              <p className="home-tile-text">
                Refactors, tweaks, polish. What got better that wasn&apos;t a new feature.
              </p>
            </div>
            <div className="home-tile">
              <h3 className="home-tile-title">Still Shifting</h3>
              <p className="home-tile-text">
                The parts you keep reworking. The things you haven&apos;t locked in yet.
              </p>
            </div>
            <div className="home-tile">
              <h3 className="home-tile-title">Left Off</h3>
              <p className="home-tile-text">
                Where you stopped. The first thing to pick up tomorrow.
              </p>
            </div>
            <div className="home-tile">
              <h3 className="home-tile-title">Key Takeaways</h3>
              <p className="home-tile-text">
                One observation worth remembering. A nudge for the next session.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================================
          CLI OR WEB — split tile. Two paths to the same product,
          designed to fit different workflows. =========================================================== */}
      <section className="home-section">
        <div className="home-section-inner">
          <p className="home-eyebrow">Two ways to use it</p>
          <h2 className="home-section-title">CLI or web. Your call.</h2>
          <div className="home-split">
            <div className="home-split-tile">
              <h3 className="home-split-tile-title">CLI</h3>
              <p className="home-split-tile-text">
                Runs locally in any git repo. Bring your own API key. Pipe the output anywhere. 100%
                offline-capable except the call to your chosen LLM provider.
              </p>
              <pre className="home-split-tile-code">
                <code>npm install -g askscout</code>
                <br />
                <code>askscout --setup</code>
                <br />
                <code>askscout</code>
              </pre>
            </div>
            <div className="home-split-tile">
              <h3 className="home-split-tile-title">Web app</h3>
              <p className="home-split-tile-text">
                Sign in with GitHub. Hosted API key, no setup. Persistent history across sessions.
                Insights, streaks, and per-repo activity over time.
              </p>
              <div className="home-split-tile-cta">
                <Link href="/dashboard" className="home-cta home-cta--inline">
                  Try it on the web →
                </Link>
              </div>
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
            askscout reads commit messages and diffs. It never reads full source files, environment
            variables, or anything outside the changes themselves. The web app stores your digests
            scoped to your GitHub user; the CLI stores nothing in the cloud.{" "}
            <Link href="/privacy" className="home-prose-link">
              Read the full policy →
            </Link>
          </p>
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
