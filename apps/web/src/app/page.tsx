import { redirect } from "next/navigation";
import Link from "next/link";
import { Forward } from "lucide-react";
import { auth, signIn } from "@/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallChip } from "@/components/InstallChip";
import { HeroStars } from "@/components/HeroStars";
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
              and Jira track what you planned, not what the AI shipped. And asking the AI to
              summarize would mean pasting diffs by hand every day. Nobody does that.
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
          HOW IT WORKS — three tiles, web-app explicit. The web app
          is the primary funnel. CLI gets its own section later for
          users who want it local. Each tile: number, short title,
          one-line description. Visual rhythm > information density. =========================================================== */}
      <section className="home-section">
        <div className="home-section-inner">
          <p className="home-eyebrow">How it works</p>
          <h2 className="home-section-title">Three steps. That&apos;s it.</h2>
          <div className="home-steps">
            <div className="home-step">
              <span className="home-step-num">01</span>
              <h3 className="home-step-title">Sign in with GitHub</h3>
              <p className="home-step-text">
                One click. Read-only access. Scout pulls your commit history, never your source.
              </p>
            </div>
            <div className="home-step">
              <span className="home-step-num">02</span>
              <h3 className="home-step-title">Pick a repo</h3>
              <p className="home-step-text">
                Or let Scout auto-pick your most active. Switch any time. Everything is per-repo.
              </p>
            </div>
            <div className="home-step">
              <span className="home-step-num">03</span>
              <h3 className="home-step-title">Read your digest</h3>
              <p className="home-step-text">
                Streams in plain English in seconds. Streaks, insights, and history build as you go.
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
          <h2 className="home-section-title">What you&apos;ll actually read.</h2>
          <p className="home-section-deck">
            Six sections, same order every day. You learn the shape after a couple of reads and it
            becomes a daily habit.
          </p>
          <div className="home-grid">
            <div className="home-tile">
              <h3 className="home-tile-title">Vibe Check</h3>
              <p className="home-tile-text">
                A one-line read on how the day went, before any of the specifics.
              </p>
            </div>
            <div className="home-tile">
              <h3 className="home-tile-title">Shipped</h3>
              <p className="home-tile-text">
                Things you actually finished. Not the experiments that got reverted.
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
                The parts you keep coming back to. Things that aren&apos;t settled yet.
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
                One thing worth remembering for next time. Sometimes the most useful line.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===========================================================
          PREFER LOCAL — CLI section, demoted from the previous
          equal-weight split. By this point the page has already
          covered the web app (hero + How It Works), so this section
          exists for power users who want everything to run on their
          machine. Single tile, lead-with-the-CLI framing. =========================================================== */}
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
