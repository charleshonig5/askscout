"use client";

import type { Digest } from "@askscout/core";
import { ExportActions } from "./ExportActions";
import { MOCK_STREAMING_TEXT } from "@/lib/mock-data";

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

interface StreamingViewProps {
  text: string;
  isStreaming: boolean;
}

function StreamingView({ text, isStreaming }: StreamingViewProps) {
  return (
    <div className="streaming-text">
      {text}
      {isStreaming && <span className="streaming-cursor" />}
    </div>
  );
}

interface StructuredDigestProps {
  digest: Digest;
  repoName: string;
  timeLabel: string;
}

function StructuredDigest({ digest, repoName, timeLabel }: StructuredDigestProps) {
  const s = digest.stats;

  return (
    <div>
      {/* Intro */}
      <div className="digest-section">
        <div className="digest-section-title">
          {"\ud83d\udc15"} Scout sniffed through {repoName}
        </div>
        <div className="digest-section-subtitle">
          {fmt(s.commits)} commits {"\u00b7"} {fmt(s.filesChanged)} files {"\u00b7"} {timeLabel}
        </div>
      </div>

      {/* Vibe Check */}
      {digest.vibeCheck && (
        <div className="digest-vibe">
          <strong>{"\ud83d\udcac"} Vibe Check</strong>
          <br />
          {digest.vibeCheck}
        </div>
      )}

      {/* Shipped */}
      {digest.shipped.length > 0 && (
        <div className="digest-section">
          <div className="digest-section-title">{"\ud83d\ude80"} Shipped</div>
          <div className="digest-section-subtitle">
            Scout dug up {digest.shipped.length} new{" "}
            {digest.shipped.length === 1 ? "thing" : "things"} you got working:
          </div>
          {digest.shipped.map((item, i) => (
            <div key={i} className="digest-item">
              {item.summary}
            </div>
          ))}
        </div>
      )}

      {/* Changed */}
      {digest.changed.length > 0 && (
        <div className="digest-section">
          <div className="digest-section-title">{"\ud83d\udd27"} Changed</div>
          <div className="digest-section-subtitle">
            Scout noticed you were poking around in {digest.changed.length}{" "}
            {digest.changed.length === 1 ? "spot" : "spots"}:
          </div>
          {digest.changed.map((item, i) => (
            <div key={i} className="digest-item">
              {item.summary}
            </div>
          ))}
        </div>
      )}

      {/* Unstable */}
      {digest.unstable.length > 0 && (
        <div className="digest-section">
          <div className="digest-section-title">{"\u26a0\ufe0f"} Unstable</div>
          <div className="digest-section-subtitle">
            Scout keeps tripping over {digest.unstable.length === 1 ? "this one" : "these"}:
          </div>
          {digest.unstable.map((item, i) => (
            <div key={i} className="digest-item">
              {item.summary} {"\u2014"} changed {item.changeCount}{" "}
              {item.changeCount === 1 ? "time" : "times"}, still wobbly
            </div>
          ))}
        </div>
      )}

      {/* Left Off */}
      {digest.leftOff.length > 0 && (
        <div className="digest-section">
          <div className="digest-section-title">{"\ud83d\udccd"} Left Off</div>
          <div className="digest-section-subtitle">Here&apos;s where you left your bone:</div>
          {digest.leftOff.map((item, i) => (
            <div key={i} className="digest-item">
              {item.summary}
            </div>
          ))}
        </div>
      )}

      {/* Health — before stats, only when available */}
      {digest.health && digest.health.length > 0 && (
        <div className="digest-section">
          <div className="digest-section-title">Project Health</div>
          <div className="health-grid">
            {digest.health.map((h, i) => (
              <div key={i} className="health-card">
                <div className="health-card-header">
                  <span className="health-card-label">{h.label}</span>
                  <span className={`health-card-level health-card-level--${h.level.toLowerCase()}`}>
                    {h.level}
                  </span>
                </div>
                <div className="health-card-bar">
                  <div
                    className={`health-card-fill health-card-fill--${h.level.toLowerCase()}`}
                    style={{ width: `${Math.round(Math.max(0, Math.min(10, h.score)) * 10)}%` }}
                  />
                </div>
                <div className="health-card-detail">{h.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats — always last */}
      <div className="digest-stats">
        {fmt(s.linesAdded)} {s.linesAdded === 1 ? "line" : "lines"} added {"\u00b7"}{" "}
        {fmt(s.linesRemoved)} removed
      </div>
    </div>
  );
}

interface ResumeViewProps {
  text: string;
}

function ResumeView({ text }: ResumeViewProps) {
  // Split the formatted prompt into sections by double newline
  const sections = text.split("\n\n").filter((s) => s.trim());

  return (
    <div>
      {sections.map((section, i) => {
        const lines = section.split("\n");
        const title = lines[0] ?? "";
        const body = lines.slice(1).join("\n");
        return (
          <div key={i} className="resume-section">
            <div className="resume-section-title">{title}</div>
            <div className="resume-section-body">{body}</div>
          </div>
        );
      })}
      <p className="text-secondary" style={{ marginTop: "var(--space-md)", fontSize: 13 }}>
        Paste this into your AI coding tool to pick up where you left off.
      </p>
      <div className="export-bar">
        <ExportActions text={text} filename="resume-prompt.md" />
      </div>
    </div>
  );
}

interface StandupViewProps {
  standup: { yesterday: string[]; today: string[]; blockers: string[] };
}

function StandupView({ standup }: StandupViewProps) {
  const copyText = [
    "Yesterday:",
    ...standup.yesterday.map((d) => `  \u2022 ${d}`),
    "\nToday:",
    ...standup.today.map((d) => `  \u2022 ${d}`),
    ...(standup.blockers.length > 0
      ? ["\nBlockers:", ...standup.blockers.map((d) => `  \u2022 ${d}`)]
      : []),
  ].join("\n");

  return (
    <div>
      <div className="standup-section">
        <div className="standup-label">Yesterday</div>
        {standup.yesterday.map((item, i) => (
          <div key={i} className="digest-item">
            {item}
          </div>
        ))}
      </div>
      <div className="standup-section">
        <div className="standup-label">Today</div>
        {standup.today.map((item, i) => (
          <div key={i} className="digest-item">
            {item}
          </div>
        ))}
      </div>
      {standup.blockers.length > 0 && (
        <div className="standup-section">
          <div className="standup-label">Blockers</div>
          {standup.blockers.map((item, i) => (
            <div key={i} className="digest-item">
              {item}
            </div>
          ))}
        </div>
      )}
      <div className="export-bar">
        <ExportActions text={copyText} filename="standup.md" />
      </div>
    </div>
  );
}

interface DigestViewProps {
  mode: "digest" | "resume" | "standup";
  digest: Digest;
  resume: string;
  standup: { yesterday: string[]; today: string[]; blockers: string[] };
  repoName: string;
  timeLabel: string;
  isStreaming: boolean;
  streamingText: string;
}

export function DigestView({
  mode,
  digest,
  resume,
  standup,
  repoName,
  timeLabel,
  isStreaming,
  streamingText,
}: DigestViewProps) {
  // While streaming, show the raw typewriter text
  if (mode === "digest" && isStreaming) {
    return <StreamingView text={streamingText} isStreaming />;
  }

  if (mode === "resume") return <ResumeView text={resume} />;
  if (mode === "standup") return <StandupView standup={standup} />;

  return (
    <div>
      <StructuredDigest digest={digest} repoName={repoName} timeLabel={timeLabel} />
      <div className="export-bar">
        <ExportActions text={MOCK_STREAMING_TEXT} filename="digest.md" />
      </div>
    </div>
  );
}
