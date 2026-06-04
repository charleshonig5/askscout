import type React from "react";
import type { Metadata } from "next";
import { HeroSection } from "@/components/HeroSection";

/* Internal compare route for the marketing hero background video.
 *
 * Renders the FULL production hero section twice — once with the
 * current video, once with a candidate replacement — so the
 * candidate can be evaluated against the real gradient overlays,
 * editorial text, and animated digest preview, NOT a stripped-down
 * mock. The main marketing page is untouched; only this route
 * loads the candidate file.
 *
 * To use:
 *   1. Drop a candidate video at apps/web/public/hero-starfield-v2.mp4
 *      (same filename, .mp4 extension, ideally < 8 MB)
 *   2. Visit /dev/hero-video-test
 *   3. Scroll between the two heros to compare with full treatment
 *   4. If approved, swap the production file + delete this route
 *
 * The GitHub "Continue with GitHub" CTA is rendered disabled here
 * (ctaDisabled prop) so clicking it in the test environment
 * doesn't start a real OAuth flow. Everything else — gradients,
 * text, chips, the animated digest preview — matches production. */

const CURRENT_VIDEO = "/hero-starfield.mp4";
const CANDIDATE_VIDEO = "/hero-starfield-v2.mp4";

export const metadata: Metadata = {
  title: "Hero video test | askScout (dev)",
  description: "Internal compare route for the marketing hero background video.",
  robots: { index: false, follow: false },
};

export default function HeroVideoTestPage() {
  return (
    <main
      style={{
        background: "var(--color-bg-secondary)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-sans)",
      }}
    >
      <header
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid var(--color-border)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(7,7,7,0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 500,
            margin: 0,
            marginBottom: 4,
          }}
        >
          Hero video compare
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>
          Scroll down to compare. CURRENT (green chip) renders the production hero with{" "}
          <code>/hero-starfield.mp4</code>. CANDIDATE (yellow chip) renders the same hero with{" "}
          <code>/hero-starfield-v2.mp4</code>.
        </p>
      </header>

      <PanelWrapper>
        <LabelChip label="CURRENT" tone="success" file={CURRENT_VIDEO} />
        <HeroSection videoSrc={CURRENT_VIDEO} ctaDisabled />
      </PanelWrapper>

      <div
        style={{
          padding: "32px 24px",
          textAlign: "center",
          background: "var(--color-bg-secondary)",
          color: "var(--color-text-secondary)",
          fontSize: 13,
          borderTop: "1px solid var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        ↓ candidate below ↓
      </div>

      <PanelWrapper>
        <LabelChip label="CANDIDATE" tone="warning" file={CANDIDATE_VIDEO} />
        <HeroSection videoSrc={CANDIDATE_VIDEO} ctaDisabled />
      </PanelWrapper>
    </main>
  );
}

function PanelWrapper({ children }: { children: React.ReactNode }) {
  // Wraps each hero so the absolutely-positioned LabelChip anchors
  // to the hero's box rather than the page <main>.
  return <div style={{ position: "relative" }}>{children}</div>;
}

function LabelChip({
  label,
  tone,
  file,
}: {
  label: string;
  tone: "success" | "warning";
  file: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        zIndex: 10,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 4,
        background: "rgba(7,7,7,0.75)",
        backdropFilter: "blur(8px)",
        border: "1px solid var(--color-border)",
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: 0.5,
        color: "var(--color-text-primary)",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: tone === "success" ? "var(--color-success)" : "var(--color-warning)",
        }}
      />
      {label} — <code style={{ fontWeight: 400 }}>{file}</code>
    </div>
  );
}
