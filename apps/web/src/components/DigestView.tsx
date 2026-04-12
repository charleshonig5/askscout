"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Download,
  Mail,
  Sparkles,
  ClipboardList,
  Share2,
  ListChecks,
} from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";
import { calculateDelay, advanceBySurrogate } from "@/lib/typewriter-pace";

/**
 * Types out text one grapheme at a time with the same variable pacing as
 * the main digest stream. Punctuation pauses, paragraph breaks, surrogate-safe.
 */
function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [revealed, setRevealed] = useState(0);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial delay before typing begins
  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Variable-paced reveal loop
  useEffect(() => {
    if (!started) return;

    const tick = () => {
      setRevealed((current) => {
        if (current >= text.length) {
          timerRef.current = null;
          return current;
        }

        const advance = advanceBySurrogate(text, current);
        const nextRevealed = current + advance;
        const revealedChar = text.slice(current, nextRevealed);
        const upcoming = text.slice(nextRevealed, nextRevealed + 6);

        // Static text: no buffer lead, no streaming — just natural pacing
        const nextDelay = calculateDelay(revealedChar, upcoming, 0, false);
        timerRef.current = setTimeout(tick, nextDelay);
        return nextRevealed;
      });
    };

    timerRef.current = setTimeout(tick, 0);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, text]);

  if (!started) return null;

  return (
    <>
      {text.slice(0, revealed)}
      {revealed < text.length && <span className="streaming-cursor" />}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFullMarkdown(text: string, stats?: any): string {
  let md = text;
  if (!stats) return md;

  const fmt = (n: number) => n.toLocaleString("en-US");
  const lines: string[] = ["\n\n---\n\n## Statistics\n"];
  if (stats.commits != null)
    lines.push(
      `+${fmt(stats.linesAdded ?? 0)} lines · -${fmt(stats.linesRemoved ?? 0)} lines · ${fmt(stats.commits)} commits · ${fmt(stats.filesChanged ?? 0)} files`,
    );
  if (stats.topFiles?.length > 0) {
    lines.push("\n### Most Active Files\n");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats.topFiles.forEach((f: any, i: number) => {
      lines.push(
        `${i + 1}. ${f.file} (+${fmt(f.added ?? 0)} / -${fmt(f.removed ?? 0)}, ${f.commits} commits)`,
      );
    });
  }
  if (stats.pace) {
    lines.push(`\n### Pace Check\n`);
    lines.push(
      `${stats.pace.multiplier}x — ${stats.pace.label} (${stats.pace.todayCommits} commits today, ${stats.pace.avgCommits}-commit average)`,
    );
  }
  md += lines.join("\n");
  return md;
}

function DownloadBtn({
  text,
  stats,
  repoName,
}: {
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats?: any;
  repoName?: string;
}) {
  const handleDownload = useCallback(() => {
    const name = repoName ?? "digest";
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${name}-${date}.md`;
    const md = buildFullMarkdown(text, stats);

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [text, stats, repoName]);

  return (
    <button className="action-btn" onClick={handleDownload}>
      <Download size={16} /> Download
    </button>
  );
}

function buildTweet(items: string[]): string {
  const MAX_CHARS = 280;
  const suffix = "\n\n#buildinpublic";

  // Build short descriptions: "Title - brief context" trimmed to fit
  const descriptions = items.map((item) => {
    const dashIdx = item.indexOf(" - ");
    if (dashIdx > 0 && dashIdx < 60) {
      const title = item.slice(0, dashIdx);
      // Take first sentence of context
      const context =
        item
          .slice(dashIdx + 3)
          .split(/[.!]/)[0]
          ?.trim() ?? "";
      return context ? `${title}: ${context}` : title;
    }
    return item.split(/[.!]/)[0]?.trim() ?? item;
  });

  let tweet: string;
  if (descriptions.length === 1) {
    tweet = `Just shipped: ${descriptions[0]} \ud83d\ude80`;
  } else {
    tweet = `Just shipped ${descriptions.length} things \ud83d\ude80\n${descriptions.map((d) => `\u2022 ${d}`).join("\n")}`;
  }

  tweet += suffix;

  // Trim items from the bottom if over limit
  while (tweet.length > MAX_CHARS && descriptions.length > 1) {
    descriptions.pop();
    tweet = `Just shipped ${descriptions.length}+ things \ud83d\ude80\n${descriptions.map((d) => `\u2022 ${d}`).join("\n")}${suffix}`;
  }

  // If still over, truncate the description
  if (tweet.length > MAX_CHARS) {
    tweet = tweet.slice(0, MAX_CHARS - 3) + "...";
  }

  return tweet;
}

function ShareBtn({ items }: { items: string[] }) {
  const handleShare = useCallback(() => {
    const tweet = buildTweet(items);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [items]);

  return (
    <button className="share-shipped-btn" onClick={handleShare}>
      <Share2 size={14} /> Share on X
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

function DigestActions({
  text,
  stats,
  repoName,
}: {
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats?: any;
  repoName?: string;
}) {
  return (
    <div className="digest-actions-row">
      <CopyBtn text={buildFullMarkdown(text, stats)} label="Copy" />
      <DownloadBtn text={text} stats={stats} repoName={repoName} />
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
  { key: "unstable", emoji: "\ud83d\udd01", label: "Still Shifting" },
  { key: "leftOff", emoji: "\ud83d\udccd", label: "Left Off" },
  { key: "takeaway", emoji: "\ud83d\udd11", label: "Key Takeaways" },
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
  takeaway: "oneTakeaway",
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

  // Manual scroll: only auto-scroll if the user is already near the bottom.
  // Throttled via RAF to avoid jank from per-tick updates.
  const lastScrollRef = useRef(0);
  useEffect(() => {
    if (!isStreaming) return;

    const now = performance.now();
    // Throttle scroll checks to ~30Hz
    if (now - lastScrollRef.current < 33) return;
    lastScrollRef.current = now;

    const rafId = requestAnimationFrame(() => {
      const cursor = cursorRef.current;
      if (!cursor) return;

      const rect = cursor.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // Only scroll if cursor is below the visible area, and
      // only if user hasn't scrolled up (near the bottom of page)
      const pageBottom = window.scrollY + window.innerHeight;
      const documentBottom = document.documentElement.scrollHeight;
      const nearBottom = documentBottom - pageBottom < 200;

      if (rect.bottom > viewportHeight - 80 && nearBottom) {
        // Instant scroll — smooth fights the stream updates
        cursor.scrollIntoView({ block: "end", behavior: "instant" as ScrollBehavior });
      }
    });

    return () => cancelAnimationFrame(rafId);
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

        if (section.key === "takeaway") {
          return (
            <div key={section.key} className="digest-section">
              <div className="digest-section-title">
                {section.emoji} {section.label}
              </div>
              <p className="formatted-paragraph">
                {section.content}
                {showCursor && cursor}
              </p>
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
            {section.key === "shipped" && !isStreaming && items.length > 0 && (
              <ShareBtn items={items} />
            )}
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
  pace?: { multiplier: number; label: string; todayCommits: number; avgCommits: number } | null;
}

function StatsCards({ stats, animate = true }: { stats: DigestViewStats; animate?: boolean }) {
  const fmt = (n: number) => n.toLocaleString("en-US");
  const added = useCountUp(stats.linesAdded, 1000, animate);
  const removed = useCountUp(stats.linesRemoved, 1000, animate);
  const commits = useCountUp(stats.commits, 1000, animate);
  const files = useCountUp(stats.filesChanged, 1000, animate);
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
    </div>
  );
}

function PaceCard({
  pace,
  animate = true,
}: {
  pace: { multiplier: number; label: string; todayCommits: number; avgCommits: number };
  animate?: boolean;
}) {
  const multiplier = useCountUp(pace.multiplier, 1000, animate, 1);
  return (
    <div className="pace-card stats-reveal-item" style={{ animationDelay: "1000ms" }}>
      <div className="pace-multiplier">{multiplier.toFixed(1)}x</div>
      <div className="pace-detail">
        <div className="pace-label">{pace.label}</div>
        <div className="pace-comparison">
          {pace.todayCommits} commits today {"\u00b7"} {pace.avgCommits}-commit average
        </div>
      </div>
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
  animate?: boolean;
  streamingText: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats: any;
  repoName?: string;
  visibleSections?: Record<string, boolean>;
  onResumeWithAI?: () => void;
  onGenerateStandup?: () => void;
  onGeneratePlan?: () => void;
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
    <div>
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
  animate = false,
  streamingText,
  stats,
  repoName,
  visibleSections,
  onResumeWithAI,
  onGenerateStandup,
  onGeneratePlan,
}: DigestViewProps) {
  const vis = (key: string) => !visibleSections || visibleSections[key] !== false;
  if (isLoading) {
    return <div className="digest-loading">Loading...</div>;
  }

  if (isStreaming && !streamingText) {
    return <div className="digest-loading">Scout is sniffing through your commits...</div>;
  }

  if (streamingText) {
    return (
      <div className={animate ? "" : "no-animation"}>
        {/* Actions at the top (hide while streaming) */}
        {!isStreaming && (
          <div className="digest-actions-top">
            <DigestActions text={streamingText} stats={stats} repoName={repoName} />
          </div>
        )}

        {/* Digest content — same component for streaming and complete */}
        <StreamingDigest
          text={streamingText}
          isStreaming={isStreaming}
          visibleSections={{ ...visibleSections, oneTakeaway: false }}
          afterLeftOff={
            onResumeWithAI ? (
              <button className="resume-ai-btn" onClick={onResumeWithAI}>
                <Sparkles size={14} /> Resume with AI
              </button>
            ) : undefined
          }
        />

        {/* Statistics → Pace Check → Codebase Health → One Takeaway
            cascade in that order when streaming finishes */}
        {!isStreaming && vis("statistics") && stats && (
          <div className="digest-section stats-reveal">
            <div
              className="digest-section-title stats-reveal-item"
              style={{ animationDelay: "0ms" }}
            >
              {"\ud83d\udcca"} Statistics
            </div>
            <div className="stats-reveal-item" style={{ animationDelay: "200ms" }}>
              <StatsCards stats={stats} animate={animate} />
            </div>
            {stats.topFiles && (
              <div className="stats-reveal-item" style={{ animationDelay: "450ms" }}>
                <TopFiles files={stats.topFiles} />
              </div>
            )}
          </div>
        )}

        {/* Pace Check — appears after Statistics */}
        {!isStreaming && vis("paceCheck") && stats?.pace && (
          <div className="digest-section stats-reveal">
            <div
              className="digest-section-title stats-reveal-item"
              style={{ animationDelay: "800ms" }}
            >
              {"\u26a1"} Pace Check
            </div>
            <PaceCard pace={stats.pace} animate={animate} />
          </div>
        )}

        {/* Codebase Health — appears after Pace Check */}
        {!isStreaming && vis("codebaseHealth") && stats?.health && (
          <div className="digest-section stats-reveal">
            <div
              className="digest-section-title stats-reveal-item"
              style={{ animationDelay: "1400ms" }}
            >
              {"\ud83e\ude7a"} Codebase Health
            </div>
            <div className="stats-reveal-item" style={{ animationDelay: "1600ms" }}>
              <CodebaseHealth health={stats.health} />
            </div>
          </div>
        )}

        {/* One Takeaway — comes last, after all data sections */}
        {!isStreaming &&
          vis("oneTakeaway") &&
          (() => {
            const takeawaySection = parseStreamingSections(streamingText).find(
              (s) => s.key === "takeaway",
            );
            if (!takeawaySection) return null;
            return (
              <div
                className="digest-section stats-reveal-item"
                style={{ animationDelay: "2200ms" }}
              >
                <div className="digest-section-title">
                  {takeawaySection.emoji} {takeawaySection.label}
                </div>
                <p className="formatted-paragraph">
                  {animate ? (
                    <TypewriterText text={takeawaySection.content} delay={2400} />
                  ) : (
                    takeawaySection.content
                  )}
                </p>
              </div>
            );
          })()}

        {/* Action buttons at the bottom (hide while streaming) */}
        {!isStreaming && (onGenerateStandup || onGeneratePlan) && (
          <div className="digest-bottom-actions">
            {onGenerateStandup && (
              <button className="standup-btn" onClick={onGenerateStandup}>
                <ClipboardList size={14} /> Generate Standup
              </button>
            )}
            {onGeneratePlan && (
              <button className="standup-btn" onClick={onGeneratePlan}>
                <ListChecks size={14} /> Today&apos;s Plan
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return <div className="digest-loading">Select a repo to generate your digest.</div>;
}
