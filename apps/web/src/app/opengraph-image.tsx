import { ImageResponse } from "next/og";

/* Dynamic Open Graph image for AskScout.
 *
 * Next 15 file convention — placing this at app/opengraph-image.tsx
 * automatically emits <meta property="og:image"> + Twitter card image
 * pointing at the route Next generates from this component.
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
 *
 * Per-page metadata can override this by exporting its own
 * opengraph-image.tsx; the root one acts as the site-wide default.
 *
 * Sizing follows the canonical spec: 1200x630 (Open Graph Protocol's
 * recommended aspect for Facebook/LinkedIn/Slack/Discord, and Twitter
 * Card type="summary_large_image" — which the root metadata declares).
 */

export const runtime = "edge";

export const alt = "AskScout — the daily digest for vibe coders";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#070707",
          color: "#ededed",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        {/* Wordmark row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: "-0.01em",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: "2px solid #ededed",
              display: "flex",
            }}
          />
          askScout
        </div>

        {/* Headline + tagline stacked */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              fontSize: 84,
              fontWeight: 400,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 1040,
            }}
          >
            The daily digest for vibe coders.
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 300,
              lineHeight: 1.35,
              color: "#a0a0a0",
              maxWidth: 980,
            }}
          >
            Reads your repo. Writes a plain-English summary of what you
            actually shipped. Open source. Bring your own LLM key.
          </div>
        </div>

        {/* Footer URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 24,
            color: "#616161",
          }}
        >
          <span>askscout.dev</span>
          <span style={{ display: "flex", gap: 32 }}>
            <span>Web app</span>
            <span>CLI</span>
            <span>MIT licensed</span>
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
