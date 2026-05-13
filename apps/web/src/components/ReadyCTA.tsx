import { Forward } from "lucide-react";
import { signIn } from "@/auth";
import { ReadyCTAInstall } from "@/components/ReadyCTAInstall";

/**
 * Reusable end-of-page CTA per Figma 244:2673. Renders the full
 * section: trust badges row (Open Source + Read Only) on top,
 * then a row with a mixed-weight Pridi headline on the left and
 * two action buttons (Try AskScout Free + npm install pill) on
 * the right.
 *
 * Drop this into any marketing page right before the footer.
 * Section wraps itself in `.home-section` so the standard 104px
 * vertical rhythm + top divider apply automatically.
 *
 * The "Try AskScout Free" button is a real GitHub sign-in via
 * server action. The install pill is a client-side copy button
 * (see <ReadyCTAInstall />).
 */
export function ReadyCTA() {
  return (
    <section className="home-section home-readycta">
      <div className="home-readycta-inner">
        <div className="home-readycta-badges">
          <a
            href="https://github.com/charleshonig5/askscout"
            target="_blank"
            rel="noopener noreferrer"
            className="home-readycta-badge"
          >
            <span>Open Source</span>
            <Forward size={10} strokeWidth={1.5} aria-hidden />
          </a>
          <span className="home-readycta-badge">
            <span>Read Only</span>
          </span>
        </div>
        <div className="home-readycta-row">
          <h2 className="home-readycta-headline">
            <span className="home-readycta-headline-thin">Get your</span>
            <span className="home-readycta-headline-bold">
              {" first digest now"}
            </span>
          </h2>
          <div className="home-readycta-actions">
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <button type="submit" className="home-readycta-btn">
                Try AskScout Free
              </button>
            </form>
            <ReadyCTAInstall />
          </div>
        </div>
      </div>
    </section>
  );
}
