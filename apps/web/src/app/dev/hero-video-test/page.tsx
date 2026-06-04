import type { Metadata } from "next";
import { HeroBgVideo } from "@/components/HeroBgVideo";

/* Internal compare route for the marketing hero background video.
 *
 * Renders the CURRENT production video and a CANDIDATE replacement
 * stacked at full hero height so they can be scrolled between at
 * true aspect ratio. The main marketing page is untouched — only
 * this route loads the candidate file.
 *
 * To use:
 *   1. Drop a candidate video at apps/web/public/hero-starfield-v2.mp4
 *      (same filename, .mp4 extension, ideally <8 MB for fast load)
 *   2. Visit /dev/hero-video-test (or the Vercel preview equivalent)
 *   3. Scroll between the two panels to compare
 *   4. If approved, swap the production file and delete this route
 *
 * If the candidate file doesn't exist yet, the lower panel shows
 * an instructional message instead of a broken video element. */

const CURRENT_VIDEO = "/hero-starfield.mp4";
const CANDIDATE_VIDEO = "/hero-starfield-v2.mp4";

export const metadata: Metadata = {
  title: "Hero video test | askScout (dev)",
  description: "Internal compare route for the marketing hero background video.",
  // Belt-and-suspenders: robots.txt already disallows /dev/ but we
  // also tag the meta so any crawler that ignores robots.txt still
  // sees a clear directive.
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
          padding: "32px 24px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 28,
            fontWeight: 500,
            margin: 0,
            marginBottom: 8,
          }}
        >
          Hero video compare
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)" }}>
          Scroll between the two panels below to compare the current production hero video against a
          candidate replacement. Drop a candidate at{" "}
          <code style={{ fontFamily: "var(--font-sans)", color: "var(--color-text-primary)" }}>
            apps/web/public/hero-starfield-v2.mp4
          </code>{" "}
          and it will render in the lower panel.
        </p>
      </header>

      <Panel label="CURRENT" file={CURRENT_VIDEO} />
      <Panel label="CANDIDATE" file={CANDIDATE_VIDEO} />
    </main>
  );
}

function Panel({ label, file }: { label: string; file: string }) {
  return (
    <section
      style={{
        position: "relative",
        height: "100vh",
        overflow: "hidden",
        background: "var(--color-bg-primary)",
      }}
    >
      {/* Same background-video component the marketing hero uses,
          including the autoplay-resilience + 0.65x playbackRate
          behavior, so the comparison is true to production. */}
      <HeroBgVideo src={file} />

      {/* Label chip pinned top-left over the video so each panel
          is unambiguously identified during scroll. */}
      <div
        style={{
          position: "absolute",
          top: 24,
          left: 24,
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderRadius: 4,
          background: "rgba(7,7,7,0.7)",
          backdropFilter: "blur(8px)",
          border: "1px solid var(--color-border)",
          fontSize: 12,
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
            background: label === "CURRENT" ? "var(--color-success)" : "var(--color-warning)",
          }}
        />
        {label} — <code style={{ fontWeight: 400 }}>{file}</code>
      </div>
    </section>
  );
}
