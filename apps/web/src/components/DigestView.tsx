"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Check, Download, Mail, Sparkles, ClipboardList } from "lucide-react";

function DownloadBtn({ text }: { text: string }) {
  const handleDownload = useCallback(() => {
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "digest.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [text]);

  return (
    <button className="action-btn" onClick={handleDownload}>
      <Download size={16} /> Download
    </button>
  );
}

function EmailBtn() {
  const [sent, setSent] = useState(false);
  const handleEmail = useCallback(() => {
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  }, []);

  return (
    <button className={`action-btn ${sent ? "copied" : ""}`} onClick={handleEmail}>
      {sent ? (
        <>
          <Check size={16} /> Sent
        </>
      ) : (
        <>
          <Mail size={16} /> Send to myself
        </>
      )}
    </button>
  );
}

function DigestActions({ text }: { text: string }) {
  return (
    <div className="digest-actions-row">
      <CopyBtn text={text} label="Copy" />
      <DownloadBtn text={text} />
      <EmailBtn />
    </div>
  );
}

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [text]);

  return (
    <button className={`action-btn ${copied ? "copied" : ""}`} onClick={handleCopy}>
      {copied ? (
        <>
          <Check size={16} /> Copied
        </>
      ) : (
        <>
          <Copy size={16} /> {label ?? "Copy"}
        </>
      )}
    </button>
  );
}

/** Renders text with proper styled bullets and section headers */
function FormattedText({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isStreaming && cursorRef.current) {
      cursorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [text, isStreaming]);

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Bullet item
    if (/^\s*[\u2022\-*]\s/.test(line)) {
      const content = trimmed.replace(/^[\u2022\-*]\s*/, "");
      elements.push(
        <div key={i} className="digest-item">
          {content}
        </div>,
      );
    }
    // Section header (non-empty, non-bullet, followed by content)
    else if (trimmed && !trimmed.startsWith("•") && trimmed.length < 80) {
      const nextLine = lines[i + 1]?.trim() ?? "";
      const isHeader = nextLine === "" || nextLine.startsWith("\u2022") || nextLine.startsWith("-");
      if (isHeader || i === 0) {
        elements.push(
          <div
            key={i}
            className="digest-section-title"
            style={{ marginTop: i > 0 ? "var(--space-lg)" : 0 }}
          >
            {trimmed}
          </div>,
        );
      } else {
        elements.push(
          <p key={i} className="formatted-paragraph">
            {trimmed}
          </p>,
        );
      }
    }
    // Regular text paragraph
    else if (trimmed) {
      elements.push(
        <p key={i} className="formatted-paragraph">
          {trimmed}
        </p>,
      );
    }
  }

  return (
    <div>
      {elements}
      {isStreaming && <span ref={cursorRef} className="streaming-cursor" />}
    </div>
  );
}

// Section markers used in the digest streaming text
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

function StreamingDigest({
  text,
  isStreaming,
  afterVibe,
  afterLeftOff,
}: {
  text: string;
  isStreaming: boolean;
  afterVibe?: React.ReactNode;
  afterLeftOff?: React.ReactNode;
}) {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const sections = parseStreamingSections(text);
  const isLastSection = (key: string) => {
    const last = sections[sections.length - 1];
    return last?.key === key;
  };

  useEffect(() => {
    if (isStreaming && cursorRef.current) {
      cursorRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [text, isStreaming]);

  const cursor = <span ref={cursorRef} className="streaming-cursor" />;

  return (
    <div>
      {sections.map((section) => {
        const showCursor = isStreaming && isLastSection(section.key);

        if (section.key === "vibe") {
          return (
            <div key={section.key}>
              <div className="digest-vibe">
                <strong>
                  {section.emoji} {section.label}
                </strong>
                <br />
                {section.content}
                {showCursor && cursor}
              </div>
              {afterVibe}
            </div>
          );
        }

        if (section.key === "stats") {
          return (
            <div key={section.key} className="digest-stats">
              {section.content}
              {showCursor && cursor}
            </div>
          );
        }

        const lines = section.content.split("\n").filter((l: string) => l.length > 0);
        // Filter out the subtitle line (starts with "Scout") and get only bullet items
        const items = lines
          .filter((l: string) => /^\s*[\u2022\-*]/.test(l) || !l.startsWith("Scout"))
          .map((l: string) => l.replace(/^\s*[\u2022\-*]\s*/, ""))
          .filter((l: string) => l.length > 0);

        return (
          <div key={section.key} className="digest-section">
            <div className="digest-section-title">
              {section.emoji} {section.label}
              {items.length > 0 && <span className="digest-count-badge">{items.length}</span>}
            </div>
            {items.map((item: string, i: number) => {
              const dashIdx = item.indexOf(" - ");
              if (dashIdx > 0 && dashIdx < 60) {
                const title = item.slice(0, dashIdx);
                const context = item.slice(dashIdx + 3);
                return (
                  <div key={i} className="digest-item">
                    <span className="digest-item-title">{title}</span>
                    {context && <> - {context}</>}
                  </div>
                );
              }
              return (
                <div key={i} className="digest-item">
                  {item}
                </div>
              );
            })}
            {showCursor && <div className="digest-item">{cursor}</div>}
            {section.key === "leftOff" && !isStreaming && afterLeftOff}
          </div>
        );
      })}
    </div>
  );
}

interface HealthIndicator {
  score: number;
  level: string;
}

interface HealthData {
  growth: HealthIndicator & { ratio: number; added: number; removed: number };
  focus: HealthIndicator & { filesPerCommit: number };
  churn: HealthIndicator & { files: number };
}

interface TopFile {
  file: string;
  commits: number;
}

interface DigestViewStats {
  commits: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  health?: HealthData;
  topFiles?: TopFile[];
  netImpact?: number;
}

function StatsCards({ stats }: { stats: DigestViewStats }) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  const net = stats.netImpact ?? stats.linesAdded - stats.linesRemoved;
  const isPositive = net >= 0;

  return (
    <div className="stats-row">
      <span className="stats-item positive">+{fmt(stats.linesAdded)} lines</span>
      {stats.linesRemoved > 0 && (
        <>
          <span className="stats-sep">{"\u00b7"}</span>
          <span className="stats-item negative">-{fmt(stats.linesRemoved)} lines</span>
        </>
      )}
      <span className="stats-sep">{"\u00b7"}</span>
      <span className="stats-item">{fmt(stats.commits)} commits</span>
      <span className="stats-sep">{"\u00b7"}</span>
      <span className="stats-item">{fmt(stats.filesChanged)} files</span>
    </div>
  );
}

function TopFiles({ files }: { files: TopFile[] }) {
  if (files.length === 0) return null;
  const maxCommits = Math.max(...files.map((f) => f.commits));
  return (
    <div className="digest-section">
      <div className="digest-section-title">Most Active Files</div>
      <div className="top-files">
        {files.map((f) => (
          <div key={f.file} className="top-file-row">
            <span className="top-file-name">{f.file.split("/").pop()}</span>
            <div className="top-file-bar-container">
              <div
                className="top-file-bar"
                style={{ width: `${(f.commits / maxCommits) * 100}%` }}
              />
            </div>
            <span className="top-file-count">
              {f.commits} {f.commits === 1 ? "commit" : "commits"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DigestViewProps {
  isStreaming: boolean;
  isLoading?: boolean;
  streamingText: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats: any;
  onResumeWithAI?: () => void;
  onGenerateStandup?: () => void;
}

function levelColor(level: string): string {
  const good = ["Lean", "Tight", "Sharp", "Clean", "Minimal", "Steady"];
  const mid = ["Growing", "Moderate"];
  if (good.includes(level)) return "strong";
  if (mid.includes(level)) return "okay";
  return "rough";
}

function CodebaseHealth({ health }: { health: HealthData }) {
  const fmt = (n: number) => n.toLocaleString("en-US");

  const indicators = [
    {
      label: "Growth",
      level: health.growth.level,
      score: health.growth.score,
      stat: `+${fmt(health.growth.added)} / -${fmt(health.growth.removed)}`,
      detail: health.growth.removed > 0 ? "Adding and cleaning up" : "Building new code",
    },
    {
      label: "Focus",
      level: health.focus.level,
      score: health.focus.score,
      stat: `${health.focus.filesPerCommit} files per commit`,
      detail:
        health.focus.filesPerCommit <= 3 ? "Changes are concentrated" : "Changes are spread out",
    },
    {
      label: "Churn",
      level: health.churn.level,
      score: health.churn.score,
      stat: `${health.churn.files} ${health.churn.files === 1 ? "file" : "files"} reworked`,
      detail: health.churn.files === 0 ? "No repeated edits" : "Same files edited 3+ times",
    },
  ];

  return (
    <div className="digest-section">
      <div className="digest-section-title">Codebase Health</div>
      <div className="health-grid">
        {indicators.map((h) => {
          const color = levelColor(h.level);
          return (
            <div key={h.label} className="health-card">
              <div className="health-card-header">
                <span className="health-card-label">{h.label}</span>
                <span className={`health-card-level health-card-level--${color}`}>{h.level}</span>
              </div>
              <div className="health-card-bar">
                <div
                  className={`health-card-fill health-card-fill--${color}`}
                  style={{ width: `${Math.max(0, Math.min(100, h.score * 10))}%` }}
                />
              </div>
              <div className="health-card-stat">{h.stat}</div>
              <div className="health-card-detail">{h.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DigestView({
  isStreaming,
  isLoading,
  streamingText,
  stats,
  onResumeWithAI,
  onGenerateStandup,
}: DigestViewProps) {
  if (isLoading) {
    return <div className="digest-loading">Loading...</div>;
  }

  if (isStreaming && !streamingText) {
    return <div className="digest-loading">Scout is sniffing through your commits...</div>;
  }

  if (isStreaming && streamingText) {
    return <FormattedText text={streamingText} isStreaming />;
  }

  if (streamingText) {
    return (
      <div>
        {/* Actions at the top */}
        <div className="digest-actions-top">
          <DigestActions text={streamingText} />
        </div>

        {/* Digest content */}
        <StreamingDigest
          text={streamingText}
          isStreaming={false}
          afterVibe={stats ? <StatsCards stats={stats} /> : undefined}
          afterLeftOff={
            onResumeWithAI ? (
              <button className="resume-ai-btn" onClick={onResumeWithAI}>
                <Sparkles size={14} /> Resume with AI
              </button>
            ) : undefined
          }
        />
        {stats?.topFiles && <TopFiles files={stats.topFiles} />}
        {stats?.health && <CodebaseHealth health={stats.health} />}

        {/* Standup button at the bottom */}
        {onGenerateStandup && (
          <button className="standup-btn" onClick={onGenerateStandup}>
            <ClipboardList size={14} /> Generate Standup
          </button>
        )}
      </div>
    );
  }

  return <div className="digest-loading">Select a repo to generate your digest.</div>;
}
