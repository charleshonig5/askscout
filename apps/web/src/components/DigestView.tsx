"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import type { Digest } from "@askscout/core";
import { MOCK_STREAMING_TEXT } from "@/lib/mock-data";

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button className={`copy-block-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
      {copied ? (
        <>
          <Check size={18} /> Copied to clipboard
        </>
      ) : (
        <>
          <Copy size={18} /> Copy to clipboard
        </>
      )}
    </button>
  );
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

// Section markers used in the streaming text
const SECTION_MARKERS = [
  { key: "vibe", emoji: "\ud83d\udcac", label: "Vibe Check" },
  { key: "shipped", emoji: "\ud83d\ude80", label: "Shipped" },
  { key: "changed", emoji: "\ud83d\udd27", label: "Changed" },
  { key: "unstable", emoji: "\u26a0\ufe0f", label: "Unstable" },
  { key: "leftOff", emoji: "\ud83d\udccd", label: "Left Off" },
  { key: "stats", emoji: "\ud83d\udcca", label: "Stats" },
] as const;

interface ParsedSection {
  key: string;
  emoji: string;
  label: string;
  content: string;
}

function parseStreamingSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];

  for (let i = 0; i < SECTION_MARKERS.length; i++) {
    const marker = SECTION_MARKERS[i]!;
    const searchStr = `${marker.emoji} ${marker.label}`;
    const startIdx = text.indexOf(searchStr);
    if (startIdx === -1) continue;

    const contentStart = startIdx + searchStr.length;

    // Find where the next section starts
    let endIdx = text.length;
    for (let j = i + 1; j < SECTION_MARKERS.length; j++) {
      const nextMarker = SECTION_MARKERS[j]!;
      const nextSearch = `${nextMarker.emoji} ${nextMarker.label}`;
      const nextIdx = text.indexOf(nextSearch, contentStart);
      if (nextIdx !== -1) {
        endIdx = nextIdx;
        break;
      }
    }

    sections.push({
      key: marker.key,
      emoji: marker.emoji,
      label: marker.label,
      content: text.slice(contentStart, endIdx).trim(),
    });
  }

  return sections;
}

function Cursor() {
  return <span className="streaming-cursor" />;
}

interface StreamingDigestProps {
  text: string;
  isStreaming: boolean;
}

function StreamingDigest({ text, isStreaming }: StreamingDigestProps) {
  const sections = parseStreamingSections(text);
  const isLastSection = (key: string) => {
    const last = sections[sections.length - 1];
    return last?.key === key;
  };

  return (
    <div>
      {sections.map((section) => {
        const showCursor = isStreaming && isLastSection(section.key);

        if (section.key === "vibe") {
          return (
            <div key={section.key} className="digest-vibe">
              <strong>
                {section.emoji} {section.label}
              </strong>
              <br />
              {section.content}
              {showCursor && <Cursor />}
            </div>
          );
        }

        if (section.key === "stats") {
          return (
            <div key={section.key} className="digest-stats">
              {section.content}
              {showCursor && <Cursor />}
            </div>
          );
        }

        // Regular sections: shipped, changed, unstable, leftOff
        const lines = section.content.split("\n").filter((l) => l.length > 0);
        const subtitle = lines[0] ?? "";
        const items = lines.slice(1).map((l) => l.replace(/^\s*\u2022\s*/, ""));

        return (
          <div key={section.key} className="digest-section">
            <div className="digest-section-title">
              {section.emoji} {section.label}
            </div>
            {subtitle && <div className="digest-section-subtitle">{subtitle}</div>}
            {items.map((item, i) => (
              <div key={i} className="digest-item">
                {item}
              </div>
            ))}
            {showCursor && (
              <div className="digest-item">
                <Cursor />
              </div>
            )}
          </div>
        );
      })}
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
              {item.summary}, changed {item.changeCount} {item.changeCount === 1 ? "time" : "times"}
              , still wobbly
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

      {/* Health */}
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
                    style={{
                      width: `${Math.round(Math.max(0, Math.min(10, h.score)) * 10)}%`,
                    }}
                  />
                </div>
                <div className="health-card-detail">{h.detail}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
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
  return (
    <div>
      <div className="ai-context-card">
        <div className="ai-context-body">{text}</div>
      </div>
      <CopyBlock text={text} />
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
      <CopyBlock text={copyText} />
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
  if (mode === "resume") return <ResumeView text={resume} />;
  if (mode === "standup") return <StandupView standup={standup} />;

  // Digest mode — streaming or complete
  if (isStreaming) {
    return <StreamingDigest text={streamingText} isStreaming />;
  }

  return (
    <div>
      <StructuredDigest digest={digest} repoName={repoName} timeLabel={timeLabel} />
      <CopyBlock text={MOCK_STREAMING_TEXT} />
    </div>
  );
}
