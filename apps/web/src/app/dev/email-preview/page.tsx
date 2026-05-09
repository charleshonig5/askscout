/**
 * Internal staging preview for the digest email template.
 *
 * Renders the same DigestEmail React component the production send
 * pipeline uses, with sample data, so we can iterate on the visual
 * design without sending real emails. Visit /dev/email-preview to
 * see the current state.
 *
 * Reachable on the deployed site for visual iteration. Contains only
 * static sample data (no real user content), so making it public is
 * safe. Once the email feature ships and we no longer need to iterate
 * on visuals, this route can be deleted or moved behind auth.
 */

import { render } from "@react-email/components";
import { DigestEmail } from "@/emails/DigestEmail";

const SAMPLE: Parameters<typeof DigestEmail>[0] = {
  digestTitle: "Today’s Digest",
  repoName: "askscout",
  streak: 7,
  dateLabel: "Thursday, May 8, 2026",
  vibeCheck:
    "You spent the whole session building out a single new job search article page, and you kept polishing it right up to the end. The work rhythm is pretty clean: first you added the core page and FAQ UI, then you tightened the surrounding SEO and discovery pieces like sitemap, layout title mapping, and related resources. The only real loop is that one article page got revisited over and over, which usually means content tweaks plus metadata tuning until it felt right. It reads like it should have been perfect on the first pass, but here we are doing the last 10 percent properly.",
  shipped: [
    {
      title: "New job search playbook",
      context:
        "A full article page that turns a brag document into resume bullets, interview stories, LinkedIn prep, and offer negotiation guidance. People can now land on a dedicated resource instead of piecing together advice from scattered pages.",
    },
  ],
  changed: [
    {
      title: "Resource discovery wiring",
      context:
        "The new article was added to the main resources listing so it shows up where users browse next. Related resources also link to it for cross-navigation.",
    },
  ],
  unstable: [
    {
      title: "Job search article content polish",
      context:
        "The main job search page was touched repeatedly across multiple commits, which suggests ongoing refinement of copy structure or embedded sections like comparisons and FAQ behavior.",
    },
  ],
  leftOff: [
    {
      title: "Follow-up SEO checks",
      context:
        "Everything added here looks self-contained as a new published resource entry point. If there is more work needed later it would likely be content expansion or follow-up SEO checks rather than unfinished wiring.",
    },
  ],
  fieldNotes: {
    subtitle: "Vocabulary debt is real in docs writing",
    body: "Today the pattern was tightening user-facing language across an entire landing surface: headline clarity in layout mapping plus SEO description plus FAQ tone inside the page. It resembles how Stripe docs treat getting-started pages as product surfaces where small wording changes matter. The tradeoff is time spent iterating on copy instead of adding brand-new features elsewhere.",
  },
  keyTakeaways:
    "This was a long arc around one thing: shipping a complete brag document for job search resource while repeatedly refining its main page until it stopped feeling drafty. Next move is to do one quick sanity pass on that same article surface for consistency between what metadata promises and what sections deliver since that file had six touches today. Then let everything else stay quiet because your sitemap and navigation hooks already look wired correctly for discovery.",
  stats: {
    commits: 19,
    filesChanged: 8,
    linesAdded: 425,
    linesRemoved: 86,
  },
  visibility: undefined,
};

export default async function EmailPreviewPage() {
  // @react-email's render returns the final HTML string. We embed it
  // in an iframe so the email's own <html>/<body> styling renders
  // correctly without leaking into or being polluted by the dashboard
  // shell around it.
  const html = await render(<DigestEmail {...SAMPLE} />, { pretty: true });

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#1a1a1a",
        padding: "24px",
        fontFamily:
          '"Work Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ maxWidth: "880px", margin: "0 auto" }}>
        <header style={{ paddingBottom: "16px", color: "#a0a0a0" }}>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#ededed" }}>
            Email preview — Digest
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "13px", lineHeight: "1.5" }}>
            Staging surface for the on-demand Email button template. Renders the same
            DigestEmail component the production send pipeline will use. Edit{" "}
            <code style={{ background: "#222", padding: "2px 4px", borderRadius: "3px" }}>
              apps/web/src/emails/DigestEmail.tsx
            </code>{" "}
            to iterate.
          </p>
        </header>

        {/* iframe constrained to exactly 600px wide so the email's
            actual canvas is what's visible — no surrounding page bg
            on the sides. Matches the email's `maxWidth: 600px`
            container width. */}
        {/* scrolling="no" suppresses both axes inside the iframe so
            no scrollbar artifacts appear — the iframe is sized to
            fit the email's full height (1500px) and matches the
            email's exact 600px canvas width, so neither axis ever
            actually needs to scroll. Without this, webkit reserves
            ~17px for a phantom vertical scrollbar which then
            triggers a horizontal scrollbar; the email visibly
            shifted when the user scrolled the parent page. */}
        <iframe
          title="Digest email preview"
          srcDoc={html}
          scrolling="no"
          style={{
            width: "600px",
            maxWidth: "100%",
            height: "1500px",
            display: "block",
            margin: "0 auto",
            border: "1px solid #222",
            borderRadius: "8px",
            backgroundColor: "#121212",
          }}
        />
      </div>
    </main>
  );
}
