"use client";

import { Copy, Download, Mail, Forward, Folder, GitCommitHorizontal } from "lucide-react";
import { Header } from "@/components/Header";
import { Emoji } from "@/components/Emoji";

/**
 * Visual sandbox for the mobile dashboard rebuild. Renders the chrome
 * header plus static markup for each section we've shipped so far,
 * styled by globals.css so we can compare against the Figma frames at
 * 402px viewport without going through auth.
 *
 * Sections implemented:
 *   1. Chrome header (Figma 287:3361)
 *   2. Digest page header (Figma 289:7288)
 *   3. Digest body content (Figma 287:3571)
 */
function Bullet({ title, body }: { title: string; body: string }) {
  return (
    <div className="digest-item">
      <span className="digest-item-bullet" aria-hidden />
      <p className="digest-item-text">
        <span className="digest-item-title">{title} </span>
        <span className="digest-item-desc">{body}</span>
      </p>
    </div>
  );
}

function BulletedSection({
  emoji,
  label,
  count,
  children,
}: {
  emoji: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="digest-section digest-bulleted">
      <div className="digest-bulleted-header">
        <div className="digest-bulleted-heading">
          <Emoji name={emoji} size={20} />
          <span className="digest-bulleted-label">{label}</span>
          <span className="digest-bulleted-count">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>
      </div>
      <div className="digest-bulleted-list">{children}</div>
    </div>
  );
}

const SAMPLE_BULLET = {
  title: "Quiet Day expansion",
  body: "- Repos with no new commits can start in a calm “quiet day” view and then reveal yesterday’s actual digest when you opt in.",
};

export default function HeaderPreview() {
  return (
    <div style={{ background: "var(--color-bg-primary)", minHeight: "100vh" }}>
      <Header onMenuToggle={() => {}} />

      <div className="digest-container">
        {/* Section 2: digest page header */}
        <div className="digest-page-header">
          <div className="digest-page-header-left">
            <h1 className="digest-page-name">
              <span className="digest-page-title-text">Today&rsquo;s Digest</span>
              <span className="digest-page-pills">
                <a
                  href="https://github.com/charleshonig5/askscout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="digest-repo-chip"
                >
                  askscout
                  <Forward size={10} strokeWidth={1} aria-hidden />
                </a>
                <span className="digest-streak">
                  <Emoji name="streak" size={14} /> 7 Day Streak
                </span>
              </span>
            </h1>
            <p className="digest-page-date">Thursday, April 16, 2026</p>
          </div>
          <div className="digest-page-header-right">
            <div className="digest-actions-row">
              <button type="button" className="action-btn">
                <Copy size={18} strokeWidth={1} aria-hidden />
                Copy
              </button>
              <button type="button" className="action-btn">
                <Download size={18} strokeWidth={1} aria-hidden />
                Download
              </button>
              <button type="button" className="action-btn">
                <Mail size={18} strokeWidth={1} aria-hidden />
                Email
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: digest body. Renders the same class structure as
            <StreamingDigest /> so any spacing change in globals.css is
            reflected here without instantiating the full streaming
            machinery. */}
        <div className="digest-layout">
          <div className="digest-main">
            <div className="digest-vibe">
              <div className="digest-vibe-title">
                <Emoji name="vibe" size={20} />
                <span>Vibe Check</span>
              </div>
              <p className="digest-vibe-body">
                The app is in a &ldquo;public pages are live, digest streaming is getting more
                careful&rdquo; phase. The big behavioral change today is that the dashboard waits a
                bit before refreshing history, because the SSE stream is still finishing up even
                after the main marker hits. You also started treating Key Takeaways as a first
                class part of the digest, and that flows into formatting and types now.
              </p>
            </div>

            <BulletedSection emoji="shipped" label="Shipped" count={3}>
              <Bullet title={SAMPLE_BULLET.title} body={SAMPLE_BULLET.body} />
              <Bullet title={SAMPLE_BULLET.title} body={SAMPLE_BULLET.body} />
              <Bullet title={SAMPLE_BULLET.title} body={SAMPLE_BULLET.body} />
            </BulletedSection>

            <BulletedSection emoji="changed" label="Changed" count={5}>
              <Bullet title={SAMPLE_BULLET.title} body={SAMPLE_BULLET.body} />
              <Bullet title={SAMPLE_BULLET.title} body={SAMPLE_BULLET.body} />
            </BulletedSection>

            <BulletedSection emoji="unstable" label="Still Shifting" count={2}>
              <Bullet title={SAMPLE_BULLET.title} body={SAMPLE_BULLET.body} />
              <Bullet title={SAMPLE_BULLET.title} body={SAMPLE_BULLET.body} />
            </BulletedSection>

            <BulletedSection emoji="leftOff" label="Left Off" count={3}>
              <Bullet title={SAMPLE_BULLET.title} body={SAMPLE_BULLET.body} />
              <Bullet title={SAMPLE_BULLET.title} body={SAMPLE_BULLET.body} />
              <Bullet title={SAMPLE_BULLET.title} body={SAMPLE_BULLET.body} />
            </BulletedSection>

            <div className="digest-section digest-fieldnotes">
              <div className="digest-fieldnotes-title">
                <Emoji name="fieldNotes" size={20} />
                <span>Field Notes</span>
              </div>
              <div className="digest-fieldnotes-body-row">
                <div className="digest-fieldnotes-rule" aria-hidden />
                <div className="digest-fieldnotes-content">
                  <p className="digest-fieldnotes-subtitle">
                    Next meaningful move is making sure keyTakeaways
                  </p>
                  <p className="digest-fieldnotes-body">
                    The dashboard history refresh delay tells me you hit a real timing mismatch
                    between &ldquo;done marker&rdquo; and &ldquo;full stream saved,&rdquo; then chose to stabilize it
                    by waiting for completion.
                  </p>
                </div>
              </div>
            </div>

            <div className="digest-section digest-takeaway">
              <div className="digest-takeaway-title">
                <Emoji name="takeaway" size={20} />
                <span>Key Takeaways</span>
              </div>
              <p className="digest-takeaway-body">
                The dashboard history refresh delay tells me you hit a real timing mismatch
                between &ldquo;done marker&rdquo; and &ldquo;full stream saved,&rdquo; then chose to stabilize it
                by waiting for completion. Next meaningful move is making sure keyTakeaways are
                generated reliably in real runs.
              </p>
            </div>
          </div>

          <aside className="digest-stats-sidebar">
            <div className="stats-column-header">
              <Emoji name="statistics" size={20} />
              <span>Statistics</span>
            </div>
            <div className="stats-column-body">
              <div className="stats-quick">
                <span className="stats-quick-added">+425 lines</span>
                <span className="stats-quick-removed">-86 lines</span>
                <span className="stats-quick-item">
                  <GitCommitHorizontal size={16} strokeWidth={1} aria-hidden /> 19 commits
                </span>
                <span className="stats-quick-item">
                  <Folder size={16} strokeWidth={1} aria-hidden /> 8 Files
                </span>
              </div>
              <div className="stats-subsection">
                <p className="stats-subsection-title">Most Active files</p>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  (visual placeholder for spacing audit)
                </p>
              </div>
              <div className="stats-subsection">
                <p className="stats-subsection-title">Codebase Health</p>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  (visual placeholder)
                </p>
              </div>
              <div className="stats-subsection">
                <p className="stats-subsection-title">Coding Timeline</p>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  (visual placeholder)
                </p>
              </div>
              <div className="stats-subsection">
                <p className="stats-subsection-title">Pace Check</p>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  (visual placeholder)
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
