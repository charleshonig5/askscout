"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Copy, Check, Download, Mail, Sparkles, ClipboardList } from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";

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

// Section markers used in the digest streaming text
const SECTION_MARKERS = [
  { key: "vibe", emoji: "\ud83d\udcac", label: "Vibe Check" },
  { key: "shipped", emoji: "\ud83d\ude80", label: "Shipped" },
  { key: "changed", emoji: "\ud83d\udd27", label: "Changed" },
  { key: "unstable", emoji: "\u26a0\ufe0f", label: "Unstable" },
  { key: "leftOff", emoji: "\ud83d\udccd", label: "Left Off" },
  { key: "closing", emoji: "\ud83d\udc15", label: "Closing Thoughts" },
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

/** Map from SECTION_MARKERS keys to DigestSections keys */
const sectionKeyMap: Record<string, string> = {
  vibe: "vibeCheck",
  shipped: "shipped",
  changed: "changed",
  unstable: "unstable",
  leftOff: "leftOff",
  closing: "closingThoughts",
  stats: "statistics",
};

function StreamingDigest({
  text,
  isStreaming,
  afterLeftOff,
  visibleSections,
}: {
  text: string;
  isStreaming: boolean;
  afterLeftOff?: React.ReactNode;
  visibleSections?: Record<string, boolean>;
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
        // Check if this section is hidden by user preferences
        const settingsKey = sectionKeyMap[section.key];
        if (settingsKey && visibleSections && visibleSections[settingsKey] === false) {
          return null;
        }

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
            </div>
          );
        }

        if (section.key === "closing") {
          return (
            <div key={section.key} className="digest-section">
              <div className="digest-closing">
                <strong>
                  {section.emoji} {section.label}
                </strong>
                <br />
                {section.content}
                {showCursor && cursor}
              </div>
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
  added?: number;
  removed?: number;
}

interface DigestViewStats {
  commits: number;
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  filesAdded?: number;
  filesDeleted?: number;
  health?: HealthData;
  topFiles?: TopFile[];
  netImpact?: number;
  sessions?: string[];
  activeDays?: string[];
}

function StatsCards({ stats }: { stats: DigestViewStats }) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  const netFiles = (stats.filesAdded ?? 0) - (stats.filesDeleted ?? 0);
  const added = useCountUp(stats.linesAdded);
  const removed = useCountUp(stats.linesRemoved);
  const commits = useCountUp(stats.commits);
  const files = useCountUp(stats.filesChanged);
  const net = useCountUp(Math.abs(netFiles));
  return (
    <div className="stats-row">
      <span className="stats-item positive">+{fmt(added)} lines</span>
      {stats.linesRemoved > 0 && (
        <>
          <span className="stats-sep">{"\u00b7"}</span>
          <span className="stats-item negative">-{fmt(removed)} lines</span>
        </>
      )}
      <span className="stats-sep">{"\u00b7"}</span>
      <span className="stats-item">{fmt(commits)} commits</span>
      <span className="stats-sep">{"\u00b7"}</span>
      <span className="stats-item">{fmt(files)} files</span>
      {netFiles !== 0 && (
        <>
          <span className="stats-sep">{"\u00b7"}</span>
          <span className={`stats-item ${netFiles > 0 ? "positive" : "negative"}`}>
            {netFiles > 0 ? "+" : ""}
            {fmt(netFiles > 0 ? net : -net)} net {Math.abs(netFiles) === 1 ? "file" : "files"}
          </span>
        </>
      )}
    </div>
  );
}

function TopFiles({ files }: { files: TopFile[] }) {
  if (files.length === 0) return null;
  const fmt = (n: number) => n.toLocaleString("en-US");
  return (
    <div className="digest-section">
      <div className="digest-section-title">Most Active Files</div>
      <div className="top-files">
        {files.map((f, i) => (
          <div key={f.file} className="top-file-row">
            <span className="top-file-rank">{i + 1}.</span>
            <span className="top-file-name">{f.file.split("/").slice(-2).join("/")}</span>
            <span className="top-file-detail">
              <span className="top-file-added">+{fmt(f.added ?? 0)}</span>
              {" / "}
              <span className="top-file-removed">-{fmt(f.removed ?? 0)}</span>
              <span className="top-file-commits">
                {" \u00b7 "}
                {f.commits} {f.commits === 1 ? "commit" : "commits"}
              </span>
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
  sessionChips?: string[];
  sessionLabel?: string;
  streak?: number;
  visibleSections?: Record<string, boolean>;
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
  sessionChips,
  sessionLabel,
  streak,
  visibleSections,
  onResumeWithAI,
  onGenerateStandup,
}: DigestViewProps) {
  const vis = (key: string) => !visibleSections || visibleSections[key] !== false;
  if (isLoading) {
    return <div className="digest-loading">Loading...</div>;
  }

  if (isStreaming && !streamingText) {
    return <div className="digest-loading">Scout is sniffing through your commits...</div>;
  }

  const hasChips = sessionChips && sessionChips.length > 0;
  const showMeta = hasChips || (streak && streak >= 2);

  if (streamingText) {
    return (
      <div>
        {/* Actions at the top (hide while streaming) */}
        {!isStreaming && (
          <div className="digest-actions-top">
            <DigestActions text={streamingText} />
          </div>
        )}

        {/* Digest content — same component for streaming and complete */}
        <StreamingDigest
          text={streamingText}
          isStreaming={isStreaming}
          visibleSections={visibleSections}
          afterLeftOff={
            onResumeWithAI ? (
              <button className="resume-ai-btn" onClick={onResumeWithAI}>
                <Sparkles size={14} /> Resume with AI
              </button>
            ) : undefined
          }
        />

        {/* Statistics section — staggered reveal after streaming completes */}
        {!isStreaming && vis("statistics") && stats && (
          <div className="digest-section stats-reveal">
            <div className="digest-section-title stats-reveal-item">
              {"\ud83d\udcca"} Statistics
            </div>
            {showMeta && (
              <div className="digest-meta stats-reveal-item" style={{ animationDelay: "150ms" }}>
                {hasChips && (
                  <div className="session-chips">
                    <span className="session-chips-label">{sessionLabel || "Coding Activity"}</span>
                    {sessionChips.map((label, i) => (
                      <span key={i} className="session-chip">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
                {hasChips && streak && streak >= 2 && (
                  <span className="digest-meta-sep">{"\u00b7"}</span>
                )}
                {streak && streak >= 2 && (
                  <span className="digest-meta-item digest-meta-streak">{streak}-day streak</span>
                )}
              </div>
            )}
            <div className="stats-reveal-item" style={{ animationDelay: "300ms" }}>
              <StatsCards stats={stats} />
            </div>
            {stats.topFiles && (
              <div className="stats-reveal-item" style={{ animationDelay: "550ms" }}>
                <TopFiles files={stats.topFiles} />
              </div>
            )}
            {stats.health && (
              <div className="stats-reveal-item" style={{ animationDelay: "800ms" }}>
                <CodebaseHealth health={stats.health} />
              </div>
            )}
          </div>
        )}

        {/* Standup button at the bottom (hide while streaming) */}
        {!isStreaming && onGenerateStandup && (
          <button className="standup-btn" onClick={onGenerateStandup}>
            <ClipboardList size={14} /> Generate Standup
          </button>
        )}
      </div>
    );
  }

  return <div className="digest-loading">Select a repo to generate your digest.</div>;
}
