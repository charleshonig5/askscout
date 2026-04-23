"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  Download,
  Send,
  ClipboardList,
  ArrowUpRight,
  ListChecks,
  ExternalLink,
} from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";
import { parseSections } from "@/lib/parse-sections";
import { SectionSkeleton, SECTION_SKELETONS, SIDEBAR_SKELETONS } from "@/components/PreGeneration";
import { Emoji } from "@/components/Emoji";
import { DigestOpener } from "@/components/DigestOpener";

/**
 * Build the text that goes into the clipboard / downloaded markdown file.
 *
 * Goals:
 *   1. Match the on-screen rendered order exactly so paste == what you saw.
 *   2. Strip private sections (Standup, Plan, AI Context, Summary) — those are
 *      accessed via their own modals, never via "Copy digest".
 *   3. Use emoji + plain-text section headers everywhere (matches the UI and
 *      renders well in Slack/Notion/email/plain-text targets).
 *   4. Respect the user's section toggles from settings.
 */
function buildFullMarkdown(
  text: string,
  stats?: DigestViewStats | null,
  visibleSections?: Record<string, boolean>,
): string {
  const isVisible = (key: string) => !visibleSections || visibleSections[key] !== false;

  // 1. Take only the digest portion. parseSections strips ---STANDUP---,
  //    ---PLAN---, ---AI_CONTEXT---, ---SUMMARY--- and everything after.
  const digestOnly = parseSections(text).digest;

  // 2. Split digest at Key Takeaways so we can move it to the end (it renders
  //    LAST in the UI, after all computed sections).
  const takeawayHeader = "\u{1F511} Key Takeaways";
  let mainDigest = digestOnly;
  let keyTakeaways = "";
  const tIdx = digestOnly.indexOf(takeawayHeader);
  if (tIdx !== -1) {
    mainDigest = digestOnly.slice(0, tIdx).trimEnd();
    keyTakeaways = digestOnly.slice(tIdx).trim();
  }

  if (!stats) {
    // No computed stats to append. Still put Key Takeaways at the end.
    return keyTakeaways && isVisible("oneTakeaway")
      ? `${mainDigest}\n\n${keyTakeaways}`
      : mainDigest;
  }

  const fmt = (n: number) => n.toLocaleString("en-US");
  const blocks: string[] = [];

  if (isVisible("statistics") && stats.commits != null) {
    blocks.push(
      [
        "\u{1F4CA} Statistics",
        `+${fmt(stats.linesAdded ?? 0)} lines \u00b7 -${fmt(stats.linesRemoved ?? 0)} lines \u00b7 ${fmt(stats.commits)} commits \u00b7 ${fmt(stats.filesChanged ?? 0)} files`,
      ].join("\n"),
    );
  }

  if (isVisible("mostActiveFiles") && (stats.topFiles?.length ?? 0) > 0) {
    const rows = stats.topFiles!.map(
      (f, i) =>
        `${i + 1}. ${f.file} (+${fmt(f.added ?? 0)} / -${fmt(f.removed ?? 0)}, ${f.commits} ${f.commits === 1 ? "commit" : "commits"})`,
    );
    blocks.push(["\u{1F4C1} Most Active Files", ...rows].join("\n"));
  }

  if (isVisible("whenYouCoded") && stats.timeline && stats.timeline.points.length > 0) {
    const fmtT = (ms: number) =>
      new Date(ms)
        .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        .toLowerCase();
    const count = stats.timeline.points.length;
    const commitsLabel = `${count} ${count === 1 ? "commit" : "commits"}`;
    const timeRange =
      stats.timeline.startMs === stats.timeline.endMs
        ? fmtT(stats.timeline.startMs)
        : `${fmtT(stats.timeline.startMs)} to ${fmtT(stats.timeline.endMs)}`;
    blocks.push(["\u{1F550} Coding Timeline", `${timeRange} \u00b7 ${commitsLabel}`].join("\n"));
  }

  if (isVisible("paceCheck") && stats.pace) {
    blocks.push(
      [
        "\u26A1 Pace Check",
        `${stats.pace.multiplier}x \u00b7 ${stats.pace.label}`,
        `${stats.pace.todayCommits} commits today \u00b7 ${stats.pace.avgCommits}-commit average`,
      ].join("\n"),
    );
  }

  if (isVisible("codebaseHealth") && stats.health) {
    const h = stats.health;
    blocks.push(
      [
        "\u{1FA7A} Codebase Health",
        `Growth: ${h.growth.level} (+${fmt(h.growth.added)} / -${fmt(h.growth.removed)})`,
        `Focus: ${h.focus.level} (${h.focus.filesPerCommit} files per commit)`,
        `Churn: ${h.churn.level} (${h.churn.files} ${h.churn.files === 1 ? "file" : "files"} reworked)`,
      ].join("\n"),
    );
  }

  // 3. Final assembly. Main digest first, computed blocks in render order,
  //    Key Takeaways last to match the UI.
  const parts: string[] = [mainDigest];
  if (blocks.length > 0) parts.push(blocks.join("\n\n"));
  if (keyTakeaways && isVisible("oneTakeaway")) parts.push(keyTakeaways);

  return parts.join("\n\n").trim();
}

function DownloadBtn({
  text,
  stats,
  repoName,
  visibleSections,
}: {
  text: string;
  stats?: DigestViewStats | null;
  repoName?: string;
  visibleSections?: Record<string, boolean>;
}) {
  const handleDownload = useCallback(() => {
    const name = repoName ?? "digest";
    const date = new Date().toISOString().slice(0, 10);
    const filename = `${name}-${date}.md`;
    const md = buildFullMarkdown(text, stats, visibleSections);

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [text, stats, repoName, visibleSections]);

  return (
    <button className="action-btn" onClick={handleDownload}>
      <Download size={20} strokeWidth={1} /> Download
    </button>
  );
}

function buildTweet(items: string[]): string {
  const MAX_CHARS = 280;
  const suffix = "\n\n#buildinpublic";

  // Use TITLES only (part before " - ") so all shipped items fit in a tweet.
  // The old version included the full context which pushed us over 280 chars
  // fast and the trim loop dropped items until often only one remained.
  const titles = items
    .map((item) => {
      const dashIdx = item.indexOf(" - ");
      if (dashIdx > 0 && dashIdx < 60) {
        return item.slice(0, dashIdx).trim();
      }
      // No " - " separator: take the first sentence, hard-cap at 60 chars.
      const first = item.split(/[.!]/)[0]?.trim() ?? item.trim();
      return first.length > 60 ? first.slice(0, 57) + "..." : first;
    })
    .filter((t) => t.length > 0);

  if (titles.length === 0) return "";

  if (titles.length === 1) {
    return `Just shipped: ${titles[0]} \ud83d\ude80${suffix}`;
  }

  const buildList = (list: string[], totalCount: number, moreCount: number) => {
    const bullets = list.map((t) => `\u2022 ${t}`).join("\n");
    const tail = moreCount > 0 ? `\n\u2022 +${moreCount} more` : "";
    return `Just shipped ${totalCount} things \ud83d\ude80\n${bullets}${tail}${suffix}`;
  };

  let kept = titles.length;
  let tweet = buildList(titles, titles.length, 0);

  // If we're over the cap (e.g., many long titles), trim from the bottom and
  // note how many were dropped so the reader knows there's more.
  while (tweet.length > MAX_CHARS && kept > 1) {
    kept--;
    tweet = buildList(titles.slice(0, kept), titles.length, titles.length - kept);
  }

  // Ultimate fallback: even one title + "+N more" is too long. Hard truncate.
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
    <button className="digest-bulleted-share" onClick={handleShare} aria-label="Share on X">
      Share on X
      <ArrowUpRight size={10} strokeWidth={1} aria-hidden />
    </button>
  );
}

/** Small header button that opens the AIContextModal from the Left Off
    section. Mirrors the ShareBtn style — small bordered pill with a 10px
    arrow glyph. */
function ResumePromptBtn({ onClick }: { onClick: () => void }) {
  return (
    <button className="digest-bulleted-share" onClick={onClick} aria-label="Open Resume Prompt">
      Resume Prompt
      <ArrowUpRight size={10} strokeWidth={1} aria-hidden />
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
          <Check size={20} strokeWidth={1} /> Sent
        </>
      ) : (
        <>
          <Send size={20} strokeWidth={1} /> Email
        </>
      )}
    </button>
  );
}

export function DigestActions({
  text,
  stats,
  repoName,
  visibleSections,
}: {
  text: string;
  stats?: DigestViewStats | null;
  repoName?: string;
  visibleSections?: Record<string, boolean>;
}) {
  return (
    <div className="digest-actions-row">
      <CopyBtn text={buildFullMarkdown(text, stats, visibleSections)} label="Copy" />
      <DownloadBtn
        text={text}
        stats={stats}
        repoName={repoName}
        visibleSections={visibleSections}
      />
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
          <Check size={20} strokeWidth={1} /> Copied
        </>
      ) : (
        <>
          <Copy size={20} strokeWidth={1} /> {label ?? "Copy"}
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

// Regex matching any line that begins with a section emoji — used defensively
// to filter out LLM-repeated section headers from bullet lists.
const SECTION_EMOJI_PREFIX = /^[\u{1F4AC}\u{1F680}\u{1F527}\u{1F501}\u{1F4CD}\u{1F511}\u{1F4CA}]/u;

interface ParsedSection {
  key: string;
  emoji: string;
  label: string;
  content: string;
}

/** Tiny pulsing pill shown on the section currently being streamed. */
function LiveBadge() {
  return (
    <span className="live-badge" aria-label="Currently streaming">
      <span className="live-badge-dot" />
      <span className="live-badge-text">Live</span>
    </span>
  );
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
  onResumeWithAI,
  visibleSections,
}: {
  text: string;
  isStreaming: boolean;
  /** If provided, the Left Off section renders a small "Resume Prompt"
      button in its header that fires this callback (opens the
      AIContextModal at the call site). */
  onResumeWithAI?: () => void;
  visibleSections?: Record<string, boolean>;
}) {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const sections = parseStreamingSections(text);
  const isLastSection = (key: string) => {
    const last = sections[sections.length - 1];
    return last?.key === key;
  };

  // Auto-scroll during streaming was removed — it fought users who were
  // reading earlier sections while later ones were still typing in. The
  // cursor still renders for visual feedback; scroll position is left
  // entirely under the user's control.

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
            <div key={section.key} className="digest-vibe">
              <div className="digest-vibe-title">
                <Emoji name={section.key} size={20} />
                <span>{section.label}</span>
                {showCursor && <LiveBadge />}
              </div>
              <p className="digest-vibe-body">
                {section.content}
                {showCursor && cursor}
              </p>
            </div>
          );
        }

        if (section.key === "takeaway") {
          return (
            <div key={section.key} className="digest-section">
              <div className="digest-section-title">
                <Emoji name={section.key} size={18} /> {section.label}
                {showCursor && <LiveBadge />}
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
        // Only keep lines that explicitly start with a bullet character.
        // Defensively strip any line that looks like a section header (starts
        // with one of our section emojis) to handle LLMs that occasionally
        // repeat the header text inside the section content.
        const items = lines
          .filter((l: string) => /^\s*[\u2022\-*]/.test(l))
          .map((l: string) => l.replace(/^\s*[\u2022\-*]\s*/, "").trim())
          .filter((l: string) => l.length > 0)
          .filter((l: string) => !SECTION_EMOJI_PREFIX.test(l));

        return (
          <div key={section.key} className="digest-section digest-bulleted">
            <div className="digest-bulleted-header">
              <div className="digest-bulleted-heading">
                <Emoji name={section.key} size={20} />
                <span className="digest-bulleted-label">{section.label}</span>
                {items.length > 0 && (
                  <span className="digest-bulleted-count">
                    {items.length} {items.length === 1 ? "item" : "items"}
                  </span>
                )}
                {showCursor && <LiveBadge />}
              </div>
              {section.key === "shipped" && !isStreaming && items.length > 0 && (
                <ShareBtn items={items} />
              )}
              {section.key === "leftOff" && !isStreaming && onResumeWithAI && (
                <ResumePromptBtn onClick={onResumeWithAI} />
              )}
            </div>
            <div className="digest-bulleted-list">
              {items.map((item: string, i: number) => {
                const dashIdx = item.indexOf(" - ");
                const hasSplit = dashIdx > 0 && dashIdx < 60;
                const title = hasSplit ? item.slice(0, dashIdx) : null;
                const context = hasSplit ? item.slice(dashIdx + 3) : item;
                return (
                  <div key={i} className="digest-item">
                    <span className="digest-item-bullet" aria-hidden />
                    <p className="digest-item-text">
                      {title && <span className="digest-item-title">{title}</span>}
                      {title && context && " - "}
                      {context && <span className="digest-item-context">{context}</span>}
                    </p>
                  </div>
                );
              })}
              {showCursor && (
                <div className="digest-item">
                  <span className="digest-item-bullet" aria-hidden />
                  <p className="digest-item-text">{cursor}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Progressive skeletons: while streaming, render a skeleton for every
          SECTION_SKELETONS entry that hasn't arrived in the parsed sections
          yet. This prevents the page from collapsing when typing starts —
          skeletons hold space for upcoming sections and get replaced in
          order as their markers appear in the stream. Skip sections the
          user has toggled off in settings. */}
      {isStreaming &&
        SECTION_SKELETONS.filter((shape) => {
          const settingsKey = sectionKeyMap[shape.key];
          if (settingsKey && visibleSections && visibleSections[settingsKey] === false) {
            return false;
          }
          return !sections.some((s) => s.key === shape.key);
        }).map((shape, i) => (
          <SectionSkeleton key={shape.key} shape={shape} animationDelay={i * 60} />
        ))}
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

export interface DigestViewStats {
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
  timeline?: {
    startMs: number;
    endMs: number;
    points: Array<{ timeMs: number; lines: number; added?: number; removed?: number }>;
  } | null;
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
  animationDelay = "1000ms",
}: {
  pace: { multiplier: number; label: string; todayCommits: number; avgCommits: number };
  animate?: boolean;
  animationDelay?: string;
}) {
  const multiplier = useCountUp(pace.multiplier, 1000, animate, 1);
  return (
    <div className="pace-card stats-reveal-item" style={{ animationDelay }}>
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

type TimelinePoint = { timeMs: number; lines: number; added?: number; removed?: number };

function WhenYouCoded({
  timeline,
}: {
  timeline: { startMs: number; endMs: number; points: Array<TimelinePoint> };
}) {
  // Touch-device tap-to-pin for the bar tooltips. Single string tracks which
  // bar (if any) is pinned open; tapping anywhere else or the same bar closes.
  const [openBarKey, setOpenBarKey] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openBarKey) return;
    const handler = (e: Event) => {
      const target = e.target as Node | null;
      if (target && trackRef.current && !trackRef.current.contains(target)) {
        setOpenBarKey(null);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [openBarKey]);

  if (timeline.points.length === 0) return null;

  // Single commit edge case — startMs === endMs. Center the bar at 50%.
  const isSinglePoint = timeline.startMs === timeline.endMs;
  const span = isSinglePoint ? 1 : timeline.endMs - timeline.startMs;

  // Walk the span in calendar-day chunks. Produces one segment per local day
  // touched by the timeline. DST-safe (uses setDate, not 24h math).
  type DaySeg = {
    dayName: string;
    startMs: number;
    endMs: number;
    leftPct: number;
    rightPct: number;
  };
  const daySegments: DaySeg[] = [];
  if (isSinglePoint) {
    daySegments.push({
      dayName: new Date(timeline.startMs).toLocaleDateString("en-US", { weekday: "long" }),
      startMs: timeline.startMs,
      endMs: timeline.endMs,
      leftPct: 0,
      rightPct: 100,
    });
  } else {
    let segStart = timeline.startMs;
    const cursor = new Date(timeline.startMs);
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() + 1); // first midnight after startMs's day-start
    while (cursor.getTime() < timeline.endMs) {
      const segEnd = cursor.getTime();
      if (segEnd > segStart) {
        daySegments.push({
          dayName: new Date(segStart).toLocaleDateString("en-US", { weekday: "long" }),
          startMs: segStart,
          endMs: segEnd,
          leftPct: ((segStart - timeline.startMs) / span) * 100,
          rightPct: ((segEnd - timeline.startMs) / span) * 100,
        });
        segStart = segEnd;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    daySegments.push({
      dayName: new Date(segStart).toLocaleDateString("en-US", { weekday: "long" }),
      startMs: segStart,
      endMs: timeline.endMs,
      leftPct: ((segStart - timeline.startMs) / span) * 100,
      rightPct: 100,
    });
  }
  const crossesDay = daySegments.length > 1;
  const breakPercents = daySegments.slice(0, -1).map((s) => s.rightPct);

  // Tooltip formatter — keeps minutes for precision on hover. Day prefix is
  // abbreviated ("Wed" not "Wednesday") so the tooltip stays compact.
  const fmtTime = (ms: number) => {
    const d = new Date(ms);
    const time = d
      .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      .toLowerCase();
    if (!crossesDay) return time;
    const day = d.toLocaleDateString("en-US", { weekday: "short" });
    return `${day} ${time}`;
  };

  // Bottom-label formatter — rounds to the nearest hour. Keeps the axis uncluttered.
  // 9:14am → 9am · 2:30pm → 3pm · 7:46pm → 8pm · midnight → 12am · noon → 12pm
  const fmtHour = (ms: number) => {
    const d = new Date(ms);
    if (d.getMinutes() >= 30) d.setHours(d.getHours() + 1);
    d.setMinutes(0, 0, 0);
    let h = d.getHours();
    const ampm = h < 12 ? "am" : "pm";
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return `${h}${ampm}`;
  };

  // Precise time formatter — used for narrow spans where hour-rounding would
  // collapse every label to the same value (e.g. three "10am"s for a 15-min burst).
  // 10:05am · 10:20am · 12:45pm
  const fmtTimePrecise = (ms: number) => {
    const d = new Date(ms);
    const hour24 = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hour24 < 12 ? "am" : "pm";
    let hour = hour24 % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minutes.toString().padStart(2, "0")}${ampm}`;
  };

  // If the single-day span is narrow, hour-rounding would duplicate labels.
  // Switch to precise times + drop the middle label once span < 3 hours.
  const spanHours = span / (1000 * 60 * 60);
  const useNarrowLabels = !crossesDay && spanHours < 3 && !isSinglePoint;

  // ── Histogram binning ──────────────────────────────────────────────────
  // Visually identical to the old Coding Timeline: black vertical bars on
  // a horizontal baseline, midnight gaps for multi-day, same tooltip feel.
  // What changed is the data model underneath — instead of one column per
  // commit (which bunched into overlapping dots on busy days), we render
  // one bar per time bin and scale its HEIGHT by total lines changed in
  // that bin. Bar WIDTH is fixed at 14px in CSS so every bar is visually
  // identical in thickness across every digest and viewport.
  //
  // Multi-day rule: bins NEVER cross midnight. Each day segment gets its
  // own set of bins allocated proportional to the segment's share of the
  // total span (min 2 bins per segment so a short day isn't collapsed).
  // Bin positions are expressed as a `centerPct` on the full track, using
  // each segment's leftPct/rightPct so bins stay inside their day's visual
  // range — and the midnight gap between segments stays visually clean.
  //
  // TOTAL_BINS is tuned so that even when every bin is populated, adjacent
  // 14px bars have a clear visible gap. On a typical ~390px track:
  //   16 bins → ~24.5px per slot → ~10.5px gap between bars
  // Bumping this number trades resolution for crowding. 16 is the
  // comfortable middle ground for a workday view.
  const TOTAL_BINS = 16;

  type Bin = {
    startMs: number;
    endMs: number;
    centerPct: number;
    commitCount: number;
    totalAdded: number;
    totalRemoved: number;
    totalLines: number;
  };

  const bins: Bin[] = [];

  if (isSinglePoint) {
    // Degenerate case: one narrow bar centered at 50% (a single moment, not
    // a wall). All commits share that single bucket.
    const added = timeline.points.reduce((s, p) => s + (p.added ?? 0), 0);
    const removed = timeline.points.reduce((s, p) => s + (p.removed ?? 0), 0);
    const lines = timeline.points.reduce((s, p) => s + p.lines, 0);
    bins.push({
      startMs: timeline.startMs,
      endMs: timeline.endMs,
      centerPct: 50,
      commitCount: timeline.points.length,
      totalAdded: added,
      totalRemoved: removed,
      totalLines: lines,
    });
  } else {
    // Allocate bins to each day segment proportional to its span share.
    // Run this allocation loop explicitly so rounding leftovers always go
    // to the last segment — prevents total drift from TOTAL_BINS.
    const segmentBinCounts: number[] = [];
    let allocated = 0;
    daySegments.forEach((seg, i) => {
      const isLast = i === daySegments.length - 1;
      if (isLast) {
        segmentBinCounts.push(Math.max(2, TOTAL_BINS - allocated));
      } else {
        const segSpan = seg.endMs - seg.startMs;
        const count = Math.max(2, Math.round((segSpan / span) * TOTAL_BINS));
        segmentBinCounts.push(count);
        allocated += count;
      }
    });

    // Build bins within each segment. centerPct uses the segment's own
    // leftPct/rightPct range so each bin's visual position respects the
    // midnight gap rather than crossing it.
    daySegments.forEach((seg, segIdx) => {
      const count = segmentBinCounts[segIdx]!;
      const segSpanMs = seg.endMs - seg.startMs;
      const segWidthPct = seg.rightPct - seg.leftPct;
      const binMs = segSpanMs / count;
      const binWidthPct = segWidthPct / count;
      for (let i = 0; i < count; i++) {
        bins.push({
          startMs: seg.startMs + i * binMs,
          endMs: seg.startMs + (i + 1) * binMs,
          centerPct: seg.leftPct + (i + 0.5) * binWidthPct,
          commitCount: 0,
          totalAdded: 0,
          totalRemoved: 0,
          totalLines: 0,
        });
      }
    });

    // Place commits. Walk bins in order; inclusive start, exclusive end
    // except for the final bin which captures a commit at exactly endMs.
    for (const p of timeline.points) {
      for (let i = 0; i < bins.length; i++) {
        const bin = bins[i]!;
        const isFinalBin = i === bins.length - 1;
        const inRange = isFinalBin
          ? p.timeMs >= bin.startMs && p.timeMs <= bin.endMs
          : p.timeMs >= bin.startMs && p.timeMs < bin.endMs;
        if (inRange) {
          bin.commitCount += 1;
          bin.totalAdded += p.added ?? 0;
          bin.totalRemoved += p.removed ?? 0;
          bin.totalLines += p.lines;
          break;
        }
      }
    }
  }

  // Only render bins that actually have commits.
  const activeBins = bins.filter((b) => b.commitCount > 0);

  // Bar height scales by the biggest ACTIVE bin so the tallest bar always
  // hits the ceiling. Cap against one massive bin dominating the chart.
  const maxBinLines = Math.max(...activeBins.map((b) => b.totalLines), 1);
  const MAX_BAR_HEIGHT = 68; // px; track is 80 with 12px breathing room
  const MIN_BAR_HEIGHT = 6;
  const barHeight = (lines: number) => {
    const ratio = Math.min(lines / maxBinLines, 1);
    return Math.max(MIN_BAR_HEIGHT, ratio * MAX_BAR_HEIGHT);
  };

  // Split the baseline at each midnight so day-changes show as a visible gap.
  // 2% gap centered on each boundary (~8-12px on typical widths).
  const GAP_PCT = 2;
  const half = GAP_PCT / 2;
  const baselineSegments: Array<{ left: number; right: number }> = [];
  let prev = 0;
  for (const bp of breakPercents) {
    baselineSegments.push({ left: prev, right: bp - half });
    prev = bp + half;
  }
  baselineSegments.push({ left: prev, right: 100 });

  return (
    <div className="when-you-coded">
      <div className="timeline-track" ref={trackRef}>
        {baselineSegments.map((seg, i) => (
          <div
            key={i}
            className="timeline-baseline"
            style={{ left: `${seg.left}%`, right: `${100 - seg.right}%` }}
          />
        ))}
        {activeBins.map((bin, i) => {
          // Bar is positioned at bin.centerPct (its slot center within the
          // track). Width is locked at 14px by CSS (.timeline-bar) so all
          // bars have identical thickness — only height encodes data.
          const h = barHeight(bin.totalLines);
          const barKey = `bin-${i}-${bin.startMs}`;
          const isTapOpen = openBarKey === barKey;
          // Edge-aware tooltip anchoring: bars near the start/end of the
          // track anchor their tooltip to that edge so it doesn't clip.
          const edgeClass =
            bin.centerPct < 15
              ? " timeline-bar--edge-left"
              : bin.centerPct > 85
                ? " timeline-bar--edge-right"
                : "";
          const hasDetailedStats = bin.totalAdded > 0 || bin.totalRemoved > 0;
          const sameTime = bin.startMs === bin.endMs;
          return (
            <div
              key={barKey}
              className={`timeline-bar${edgeClass}${isTapOpen ? " tap-open" : ""}`}
              style={{
                left: `${bin.centerPct}%`,
                bottom: "2px",
                height: `${h}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setOpenBarKey((prev) => (prev === barKey ? null : barKey));
              }}
            >
              <div className="timeline-tooltip" role="tooltip">
                <div className="timeline-tooltip-lines">
                  {bin.commitCount} {bin.commitCount === 1 ? "commit" : "commits"}
                  {hasDetailedStats ? (
                    <>
                      {" \u00b7 "}
                      <span className="timeline-tooltip-added">
                        +{bin.totalAdded.toLocaleString()}
                      </span>
                      {" / "}
                      <span className="timeline-tooltip-removed">
                        -{bin.totalRemoved.toLocaleString()}
                      </span>
                    </>
                  ) : bin.totalLines > 0 ? (
                    // Old stored digests carry only `lines` (no +/- split).
                    // Fall back to the total so the tooltip is never empty.
                    <>
                      {" \u00b7 "}
                      {bin.totalLines.toLocaleString()} {bin.totalLines === 1 ? "line" : "lines"}
                    </>
                  ) : null}
                </div>
                <div className="timeline-tooltip-time">
                  {sameTime
                    ? fmtTime(bin.startMs)
                    : `${fmtTime(bin.startMs)} \u2013 ${fmtTime(bin.endMs)}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {crossesDay ? (
        <div className="timeline-multi-labels">
          {daySegments.map((seg, i) => {
            const widthPct = seg.rightPct - seg.leftPct;
            const tooNarrow = widthPct < 10;
            const isLast = i === daySegments.length - 1;
            // Filter commits within this segment. Exclusive upper bound on all
            // but the last segment, so a commit at exactly midnight isn't counted
            // twice (it belongs to the next day, not this one).
            const segPoints = timeline.points.filter((p) =>
              isLast
                ? p.timeMs >= seg.startMs && p.timeMs <= seg.endMs
                : p.timeMs >= seg.startMs && p.timeMs < seg.endMs,
            );
            const hasCommits = segPoints.length > 0;
            // Labels reflect ACTUAL first/last commits within the day segment,
            // not the midnight segment boundary. Thursday reads "11am · 7pm"
            // (when coding happened) instead of "12am · 7pm" (boundary).
            const labelStart = hasCommits ? fmtHour(segPoints[0]!.timeMs) : "";
            const labelEnd = hasCommits ? fmtHour(segPoints[segPoints.length - 1]!.timeMs) : "";
            const sameLabel = hasCommits && labelStart === labelEnd;
            return (
              <div
                key={i}
                className="timeline-day-segment"
                style={{
                  left: `${seg.leftPct}%`,
                  width: `${widthPct}%`,
                }}
              >
                {!tooNarrow && hasCommits && (
                  <div
                    className={
                      sameLabel
                        ? "timeline-segment-times timeline-segment-times--single"
                        : "timeline-segment-times"
                    }
                  >
                    {sameLabel ? (
                      <span>{labelStart}</span>
                    ) : (
                      <>
                        <span>{labelStart}</span>
                        <span>{labelEnd}</span>
                      </>
                    )}
                  </div>
                )}
                <div className="timeline-day-name">{seg.dayName}</div>
              </div>
            );
          })}
        </div>
      ) : (
        (() => {
          // Single-day path. Dedupe identical labels (commits within same rounded
          // minute/hour produce visually redundant labels like "10:05am · 10:05am").
          const dayName = new Date(timeline.startMs).toLocaleDateString("en-US", {
            weekday: "long",
          });
          if (isSinglePoint) {
            return (
              <div className="timeline-single-labels">
                <div className="timeline-labels timeline-labels--single">
                  <span>{fmtTimePrecise(timeline.startMs)}</span>
                </div>
                <div className="timeline-day-name">{dayName}</div>
              </div>
            );
          }
          if (useNarrowLabels) {
            const a = fmtTimePrecise(timeline.startMs);
            const b = fmtTimePrecise(timeline.endMs);
            return (
              <div className="timeline-single-labels">
                {a === b ? (
                  <div className="timeline-labels timeline-labels--single">
                    <span>{a}</span>
                  </div>
                ) : (
                  <div className="timeline-labels">
                    <span>{a}</span>
                    <span>{b}</span>
                  </div>
                )}
                <div className="timeline-day-name">{dayName}</div>
              </div>
            );
          }
          return (
            <div className="timeline-single-labels">
              <div className="timeline-labels">
                <span>{fmtHour(timeline.startMs)}</span>
                <span>{fmtHour((timeline.startMs + timeline.endMs) / 2)}</span>
                <span>{fmtHour(timeline.endMs)}</span>
              </div>
              <div className="timeline-day-name">{dayName}</div>
            </div>
          );
        })()
      )}
    </div>
  );
}

function TopFiles({ files, repoFullName }: { files: TopFile[]; repoFullName?: string }) {
  if (files.length === 0) return null;
  const fmt = (n: number) => n.toLocaleString("en-US");

  // Build a GitHub deep-link for a given file path. Use HEAD instead of a
  // specific branch name so this works regardless of whether the repo's
  // default branch is main, master, develop, etc. Encode each path segment
  // individually so spaces/special chars are handled but "/" stays literal.
  const buildGitHubUrl = (file: string): string | null => {
    if (!repoFullName || !/^[^/]+\/[^/]+$/.test(repoFullName)) return null;
    const encodedPath = file.split("/").map(encodeURIComponent).join("/");
    return `https://github.com/${repoFullName}/blob/HEAD/${encodedPath}`;
  };

  return (
    <div className="top-files">
      {files.map((f, i) => {
        const shortName = f.file.split("/").slice(-2).join("/");
        const url = buildGitHubUrl(f.file);
        return (
          <div key={f.file} className="top-file-row">
            <span className="top-file-rank">{i + 1}.</span>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="top-file-name top-file-name--link"
                title={f.file}
              >
                {shortName}
                <ExternalLink size={11} className="top-file-link-icon" aria-hidden />
              </a>
            ) : (
              <span className="top-file-name" title={f.file}>
                {shortName}
              </span>
            )}
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
        );
      })}
    </div>
  );
}

interface DigestViewProps {
  isStreaming: boolean;
  isLoading?: boolean;
  animate?: boolean;
  streamingText: string;
  stats: DigestViewStats | null;
  repoName?: string;
  // Full "owner/repo" slug — used to build GitHub deep-links on clickable
  // filenames in the Most Active Files section.
  repoFullName?: string;
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

/**
 * Plain-language descriptions for every (category, level) combination.
 * Hover the level badge on a Codebase Health card to see what the rating means.
 * Tone: observational, not preachy. Describes what's happening, not what's wrong.
 */
const HEALTH_DESCRIPTIONS: Record<string, Record<string, string>> = {
  Growth: {
    Lean: "Tight and balanced. About 3\u00d7 additions to removals. Small footprint with steady cleanup.",
    Steady: "Healthy growth. New code paired with real cleanup. A balanced mix.",
    Growing:
      "Mostly building. Additions lead, with some cleanup mixed in. Typical feature-push rhythm.",
    Heavy: "Lots of additions, light on deletions. In a build-heavy phase.",
    Ballooning: "Almost entirely additions. Greenfield work or a focused build sprint.",
  },
  Focus: {
    Tight: "Focused commits. Each one touches a single area. Easy to review and easy to revert.",
    Sharp: "Small, coherent changes across related files. Still quite focused.",
    Moderate: "Commits touching a handful of files. Moderate spread.",
    Wide: "Broader commits reaching across multiple areas.",
    Scattered: "Wide-ranging commits covering many areas in each push.",
  },
  Churn: {
    Clean: "Nothing getting reworked. Features are landing and staying put.",
    Minimal: "A few files returning for revisions. Normal iteration.",
    Moderate: "Several files getting repeat visits. Active rework.",
    Noisy: "A lot of files in rotation for rework. Active iteration phase.",
    High: "Many files being reworked repeatedly. Heavy iteration phase.",
  },
};

function CodebaseHealth({ health }: { health: HealthData }) {
  const fmt = (n: number) => n.toLocaleString("en-US");

  // Touch-device tap-to-pin for the level-description tooltips. A single key
  // tracks which card's tooltip is pinned (at most one at a time).
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!openCategory) return;
    const handler = (e: Event) => {
      const target = e.target as Node | null;
      if (target && gridRef.current && !gridRef.current.contains(target)) {
        setOpenCategory(null);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [openCategory]);

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
      <div className="health-grid" ref={gridRef}>
        {indicators.map((h) => {
          const color = levelColor(h.level);
          const description = HEALTH_DESCRIPTIONS[h.label]?.[h.level];
          const isTapOpen = openCategory === h.label;
          return (
            <div key={h.label} className="health-card">
              <div className="health-card-header">
                <span className="health-card-label">{h.label}</span>
                <span
                  className={`health-card-level health-card-level--${color}${
                    isTapOpen ? " tap-open" : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenCategory((prev) => (prev === h.label ? null : h.label));
                  }}
                >
                  {h.level}
                  {description && (
                    <span className="health-tooltip" role="tooltip">
                      {description}
                    </span>
                  )}
                </span>
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

/**
 * Right-column sidebar: all five computed stat sections with cascade timing,
 * or skeleton placeholders while streaming is still in progress.
 *
 * Streaming behavior: stats SSE event arrives almost immediately but we hold
 * the skeletons up through the entire streaming phase so the sidebar doesn't
 * compete for attention with the typing narrative on the left. When streaming
 * ends, skeletons unmount and the cascade-animated real cards appear.
 *
 * Empty behavior: if the user has toggled off every stat section OR if stats
 * is null, the sidebar is effectively empty — the parent decides whether to
 * render it at all (collapsing the layout to single column).
 */
function DigestStatsSidebar({
  stats,
  isStreaming,
  animate,
  visibleSections,
  repoFullName,
}: {
  stats: DigestViewStats | null;
  isStreaming: boolean;
  animate: boolean;
  visibleSections?: Record<string, boolean>;
  repoFullName?: string;
}) {
  const vis = (key: string) => !visibleSections || visibleSections[key] !== false;

  // Streaming (or no stats yet): show skeletons for every section the user
  // hasn't hidden. Once streaming ends with real stats in hand, the skeletons
  // unmount and the cascade section takes over.
  if (isStreaming || !stats) {
    const visibleSkeletons = SIDEBAR_SKELETONS.filter((s) => vis(s.key));
    return (
      <aside className="digest-stats-sidebar">
        {visibleSkeletons.map((shape, i) => (
          <SectionSkeleton key={shape.key} shape={shape} animationDelay={i * 60} />
        ))}
      </aside>
    );
  }

  return (
    <aside className="digest-stats-sidebar">
      {vis("statistics") && stats.commits != null && (
        <div className="digest-section stats-reveal">
          <div className="digest-section-title stats-reveal-item" style={{ animationDelay: "0ms" }}>
            <Emoji name="statistics" size={18} /> Statistics
          </div>
          <div className="stats-reveal-item" style={{ animationDelay: "200ms" }}>
            <StatsCards stats={stats} animate={animate} />
          </div>
        </div>
      )}

      {vis("mostActiveFiles") && stats.topFiles && stats.topFiles.length > 0 && (
        <div className="digest-section stats-reveal">
          <div
            className="digest-section-title stats-reveal-item"
            style={{ animationDelay: "450ms" }}
          >
            <Emoji name="mostActiveFiles" size={18} /> Most Active Files
          </div>
          <div className="stats-reveal-item" style={{ animationDelay: "600ms" }}>
            <TopFiles files={stats.topFiles} repoFullName={repoFullName} />
          </div>
        </div>
      )}

      {vis("whenYouCoded") && stats.timeline && (
        <div className="digest-section stats-reveal">
          <div
            className="digest-section-title stats-reveal-item"
            style={{ animationDelay: "700ms" }}
          >
            <Emoji name="whenYouCoded" size={18} /> Coding Timeline
          </div>
          <div className="stats-reveal-item" style={{ animationDelay: "900ms" }}>
            <WhenYouCoded timeline={stats.timeline} />
          </div>
        </div>
      )}

      {vis("paceCheck") && stats.pace && (
        <div className="digest-section stats-reveal">
          <div
            className="digest-section-title stats-reveal-item"
            style={{ animationDelay: "1150ms" }}
          >
            <Emoji name="paceCheck" size={18} /> Pace Check
          </div>
          <PaceCard pace={stats.pace} animate={animate} animationDelay="1350ms" />
        </div>
      )}

      {vis("codebaseHealth") && stats.health && (
        <div className="digest-section stats-reveal">
          <div
            className="digest-section-title stats-reveal-item"
            style={{ animationDelay: "1700ms" }}
          >
            <Emoji name="codebaseHealth" size={18} /> Codebase Health
          </div>
          <div className="stats-reveal-item" style={{ animationDelay: "1900ms" }}>
            <CodebaseHealth health={stats.health} />
          </div>
        </div>
      )}
    </aside>
  );
}

/**
 * Determine whether the sidebar should render at all. Returns false in any
 * case where the sidebar would be empty or useless — the layout then
 * collapses cleanly to single column.
 *
 *   - During streaming: render skeletons if user has ANY section visible.
 *     Even if stats haven't arrived yet, skeletons fill the space.
 *   - After streaming: render only if at least one visible section has
 *     real data. Prevents an empty 360px column for digests that lack a
 *     field (old cached digests, history missing newer stat types).
 */
function sidebarHasContent(
  stats: DigestViewStats | null,
  isStreaming: boolean,
  visibleSections?: Record<string, boolean>,
): boolean {
  const vis = (key: string) => !visibleSections || visibleSections[key] !== false;

  // Pre-streaming / streaming: skeletons just need at least one toggle on.
  if (isStreaming) {
    return SIDEBAR_SKELETONS.some((s) => vis(s.key));
  }

  // Post-streaming: need actual data in at least one visible section.
  if (!stats) return false;
  return (
    (vis("statistics") && stats.commits != null) ||
    (vis("mostActiveFiles") && (stats.topFiles?.length ?? 0) > 0) ||
    (vis("whenYouCoded") && stats.timeline != null) ||
    (vis("paceCheck") && stats.pace != null) ||
    (vis("codebaseHealth") && stats.health != null)
  );
}

/**
 * Opener phase machine — drives the cross-fade between the editorial opener
 * line ("Reading 12 commits across 3 files…") and the skeleton layout.
 *
 *   "active"  → opener typing/dwelling, skeletons + sidebar suppressed
 *   "fading"  → opener has fired onComplete; running its 320ms opacity fade
 *               while skeletons mount and run their own fade-in animation
 *   "done"    → opener unmounted, normal streaming flow takes over
 */
type OpenerPhase = "active" | "fading" | "done";
const OPENER_FADE_MS = 350;

export function DigestView({
  isStreaming,
  isLoading,
  animate = false,
  streamingText,
  stats,
  repoFullName,
  visibleSections,
  onResumeWithAI,
  onGenerateStandup,
  onGeneratePlan,
}: DigestViewProps) {
  // Opener state. Starts at "done" so cached/loaded digests don't replay
  // the opener — only fresh streams trigger it (see effect below).
  const [openerPhase, setOpenerPhase] = useState<OpenerPhase>("done");
  const wasStreamingRef = useRef(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // When a fresh stream kicks off (isStreaming flips false → true with no
  // text yet), arm the opener. We deliberately don't watch streamingText
  // here — if the user re-runs immediately and text has not yet been reset,
  // the wasStreamingRef gate still ensures we only re-arm on a real
  // start-of-stream transition.
  useEffect(() => {
    if (isStreaming && !wasStreamingRef.current) {
      // Cancel any in-flight fade timer from a previous stream.
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      setOpenerPhase("active");
    }
    wasStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Cleanup the fade timer if the component unmounts mid-fade.
  useEffect(
    () => () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    },
    [],
  );

  // Called by the opener when it has finished typing + dwelling. We trip
  // the fade and schedule the unmount one fade duration later. During
  // that window, skeletons mount underneath and run their own fade-in,
  // producing a clean cross-fade.
  const handleOpenerComplete = useCallback(() => {
    setOpenerPhase("fading");
    fadeTimerRef.current = setTimeout(() => {
      setOpenerPhase("done");
      fadeTimerRef.current = null;
    }, OPENER_FADE_MS);
  }, []);

  if (isLoading) {
    return <div className="digest-loading">Checking for today&apos;s digest...</div>;
  }

  // Unified streaming branch. Three sub-phases live inside it:
  //   1. opener         (isStreaming, !streamingText, openerPhase !== "done")
  //                     → DigestOpener types its line; skeletons + sidebar
  //                       are suppressed so the opener owns the moment.
  //   2. skeletons      (isStreaming, !streamingText, openerPhase === "done")
  //                     → opener has unmounted; SectionSkeleton placeholders
  //                       fade in via their own keyframe; sidebar skeletons
  //                       reveal too.
  //   3. streaming      (isStreaming, streamingText) → sections type in;
  //                       remaining skeletons hold their slots.
  //   4. done           (!isStreaming, streamingText) → final layout with
  //                       cascade-animated sidebar + bottom action buttons.
  //
  // Keeping all phases in ONE render branch lets StreamingDigest stay
  // mounted across phase transitions, avoiding remount flashes.
  if (isStreaming || streamingText) {
    // True ONLY during the editorial opener phase: opener typing or fading.
    // Used to suppress skeletons + sidebar so the opener owns the moment.
    const openerVisible = openerPhase !== "done";

    // Decide whether the two-column layout + sidebar render. Suppress them
    // entirely while the opener is on screen — they reveal as the opener
    // fades. Once the opener is done, fall back to the normal data-driven
    // gate (which also handles "all sections hidden" / missing stats).
    const renderSidebar = !openerVisible && sidebarHasContent(stats, isStreaming, visibleSections);

    return (
      <div className={animate ? "" : "no-animation"}>
        {/* Two-column layout: narrative on the left, stats sidebar on the
            right. Below 1080px the media query flattens this to a single
            column (main first, sidebar below). If renderSidebar is false
            (opener active OR all sections hidden OR no stats post-streaming)
            we skip the sidebar entirely so the layout stays single-column. */}
        <div className={`digest-layout${renderSidebar ? " digest-layout--two-col" : ""}`}>
          <div className="digest-main">
            {/* Editorial opener: types a single line using real stats from
                the SSE stats event. Owns the pre-text moment alone — no
                skeletons, no sidebar — then cross-fades to the streaming
                layout. Unmounts after its fade completes. */}
            {isStreaming && openerVisible && (
              <DigestOpener
                onComplete={handleOpenerComplete}
                fadingOut={openerPhase === "fading"}
              />
            )}

            {/* StreamingDigest is suppressed during the opener phase so
                skeletons don't render alongside the editorial line. As
                soon as the opener finishes (phase: "done"), this mounts
                and either shows skeletons (still pre-text) or the live
                streaming sections. */}
            {!openerVisible && (
              <StreamingDigest
                text={streamingText}
                isStreaming={isStreaming}
                visibleSections={visibleSections}
                onResumeWithAI={onResumeWithAI}
              />
            )}

            {/* Action buttons (Standup, To-Do) at the bottom of the main column */}
            {!isStreaming && (onGenerateStandup || onGeneratePlan) && (
              <div className="digest-bottom-actions">
                {onGenerateStandup && (
                  <button className="standup-btn" onClick={onGenerateStandup}>
                    <ClipboardList size={16} /> Generate Standup
                  </button>
                )}
                {onGeneratePlan && (
                  <button className="standup-btn" onClick={onGeneratePlan}>
                    <ListChecks size={16} /> To-Do List
                  </button>
                )}
              </div>
            )}
          </div>

          {renderSidebar && (
            <DigestStatsSidebar
              stats={stats}
              isStreaming={isStreaming}
              animate={animate}
              visibleSections={visibleSections}
              repoFullName={repoFullName}
            />
          )}
        </div>
      </div>
    );
  }

  return <div className="digest-loading">Select a repo to generate your digest.</div>;
}
