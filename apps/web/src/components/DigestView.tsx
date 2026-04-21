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
  }, [started, text]);

  if (!started) return null;

  return (
    <>
      {text.slice(0, revealed)}
      {revealed < text.length && <span className="streaming-cursor" />}
    </>
  );
}

function buildFullMarkdown(text: string, stats?: DigestViewStats | null): string {
  let md = text;
  if (!stats) return md;

  const fmt = (n: number) => n.toLocaleString("en-US");
  const lines: string[] = ["\n\n---\n\n## Statistics\n"];
  if (stats.commits != null)
    lines.push(
      `+${fmt(stats.linesAdded ?? 0)} lines · -${fmt(stats.linesRemoved ?? 0)} lines · ${fmt(stats.commits)} commits · ${fmt(stats.filesChanged ?? 0)} files`,
    );
  if ((stats.topFiles?.length ?? 0) > 0) {
    lines.push("\n### Most Active Files\n");
    stats.topFiles!.forEach((f, i) => {
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
  stats?: DigestViewStats | null;
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
  stats?: DigestViewStats | null;
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
                  {showCursor && <LiveBadge />}
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
          <div key={section.key} className="digest-section">
            <div className="digest-section-title">
              {section.emoji} {section.label}
              {items.length > 0 && <span className="digest-count-badge">{items.length}</span>}
              {showCursor && <LiveBadge />}
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

  // Bar height scales with lines changed. Cap so one massive commit doesn't dominate.
  const maxLines = Math.max(...timeline.points.map((p) => p.lines), 1);
  const MAX_BAR_HEIGHT = 68; // px; track is 80 with 12px breathing room
  const MIN_BAR_HEIGHT = 6;
  const barHeight = (lines: number) => {
    const ratio = Math.min(lines / maxLines, 1);
    return Math.max(MIN_BAR_HEIGHT, ratio * MAX_BAR_HEIGHT);
  };

  // Bucket commits that fall in the same visual column so they stack vertically.
  // 1.5% buckets ≈ ~5min on a 6-hour span, ~12min on a 16-hour span — tight enough
  // that adjacent columns stay distinct, loose enough that bursts visibly stack.
  const BUCKET_PCT = 1.5;
  const buckets = new Map<number, Array<TimelinePoint>>();
  for (const p of timeline.points) {
    const left = isSinglePoint ? 50 : ((p.timeMs - timeline.startMs) / span) * 100;
    const bucket = Math.round(left / BUCKET_PCT) * BUCKET_PCT;
    const list = buckets.get(bucket) ?? [];
    list.push(p);
    buckets.set(bucket, list);
  }

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
        {Array.from(buckets.entries()).map(([leftPct, commits]) => {
          // Stack biggest commits on the bottom so smaller ones perch on top.
          const sorted = [...commits].sort((a, b) => b.lines - a.lines);
          let cumulativeBottom = 0;
          // Edge-aware tooltip anchoring: bars near the left/right edges anchor
          // the tooltip to that edge instead of centering, so it doesn't clip.
          const edgeClass =
            leftPct < 15
              ? " timeline-bar--edge-left"
              : leftPct > 85
                ? " timeline-bar--edge-right"
                : "";
          return (
            <div key={leftPct} className="timeline-column" style={{ left: `${leftPct}%` }}>
              {sorted.map((c, i) => {
                const h = barHeight(c.lines);
                const barKey = `${leftPct}-${i}`;
                const isTapOpen = openBarKey === barKey;
                const bar = (
                  <div
                    key={i}
                    className={`timeline-bar${edgeClass}${isTapOpen ? " tap-open" : ""}`}
                    style={{ bottom: `${cumulativeBottom}px`, height: `${h}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenBarKey((prev) => (prev === barKey ? null : barKey));
                    }}
                  >
                    <div className="timeline-tooltip" role="tooltip">
                      <div className="timeline-tooltip-lines">
                        {c.added !== undefined && c.removed !== undefined ? (
                          <>
                            <span className="timeline-tooltip-added">
                              +{c.added.toLocaleString()}
                            </span>
                            {" / "}
                            <span className="timeline-tooltip-removed">
                              -{c.removed.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          // Older stored digests only have the total; fall back gracefully.
                          <>
                            {c.lines.toLocaleString()} {c.lines === 1 ? "line" : "lines"}
                          </>
                        )}
                      </div>
                      <div className="timeline-tooltip-time">{fmtTime(c.timeMs)}</div>
                    </div>
                  </div>
                );
                cumulativeBottom += h + 3; // 3px gap so each commit reads as its own piece
                return bar;
              })}
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

function TopFiles({ files }: { files: TopFile[] }) {
  if (files.length === 0) return null;
  const fmt = (n: number) => n.toLocaleString("en-US");
  return (
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
  );
}

interface DigestViewProps {
  isStreaming: boolean;
  isLoading?: boolean;
  animate?: boolean;
  streamingText: string;
  stats: DigestViewStats | null;
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
                <Sparkles size={14} />
                <span className="resume-ai-btn-text">
                  <span className="resume-ai-btn-title">Resume Prompt</span>
                  <span className="resume-ai-btn-subtitle">
                    Paste into your AI coding tool to pick up exactly where you left off
                  </span>
                </span>
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
          </div>
        )}

        {/* Most Active Files — its own section, toggleable independently */}
        {!isStreaming && vis("mostActiveFiles") && stats?.topFiles && stats.topFiles.length > 0 && (
          <div className="digest-section stats-reveal">
            <div
              className="digest-section-title stats-reveal-item"
              style={{ animationDelay: "450ms" }}
            >
              {"\ud83d\udcc1"} Most Active Files
            </div>
            <div className="stats-reveal-item" style={{ animationDelay: "600ms" }}>
              <TopFiles files={stats.topFiles} />
            </div>
          </div>
        )}

        {/* When You Coded — timeline of commits across the day.
            Only shown for single-day digests (server returns null otherwise). */}
        {!isStreaming && vis("whenYouCoded") && stats?.timeline && (
          <div className="digest-section stats-reveal">
            <div
              className="digest-section-title stats-reveal-item"
              style={{ animationDelay: "700ms" }}
            >
              {"\ud83d\udd50"} Coding Timeline
            </div>
            <div className="stats-reveal-item" style={{ animationDelay: "900ms" }}>
              <WhenYouCoded timeline={stats.timeline} />
            </div>
          </div>
        )}

        {/* Pace Check — appears after When You Coded */}
        {!isStreaming && vis("paceCheck") && stats?.pace && (
          <div className="digest-section stats-reveal">
            <div
              className="digest-section-title stats-reveal-item"
              style={{ animationDelay: "1150ms" }}
            >
              {"\u26a1"} Pace Check
            </div>
            <PaceCard pace={stats.pace} animate={animate} animationDelay="1350ms" />
          </div>
        )}

        {/* Codebase Health — appears after Pace Check */}
        {!isStreaming && vis("codebaseHealth") && stats?.health && (
          <div className="digest-section stats-reveal">
            <div
              className="digest-section-title stats-reveal-item"
              style={{ animationDelay: "1700ms" }}
            >
              {"\ud83e\ude7a"} Codebase Health
            </div>
            <div className="stats-reveal-item" style={{ animationDelay: "1900ms" }}>
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
                style={{ animationDelay: "2500ms" }}
              >
                <div className="digest-section-title">
                  {takeawaySection.emoji} {takeawaySection.label}
                </div>
                <p className="formatted-paragraph">
                  {animate ? (
                    <TypewriterText text={takeawaySection.content} delay={2700} />
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
                <ListChecks size={14} /> To-Do List
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return <div className="digest-loading">Select a repo to generate your digest.</div>;
}
