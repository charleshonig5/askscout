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

      {/* TODO(step 2): Bento grid lands here. */}
      {/* TODO(step 4): Articles strip lands later in the page (after Privacy). */}
      {/* TODO(step 3): FAQ accordion lands before the final CTA. */}

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
