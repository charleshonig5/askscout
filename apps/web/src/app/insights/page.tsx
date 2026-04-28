"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleX } from "lucide-react";
import { Emoji } from "@/components/Emoji";

/**
 * Insights page (`/insights`).
 *
 * Sibling of `/settings` — reuses the same shell primitives
 * (`.settings-page`, `.settings-card`, `.settings-header`,
 * `.settings-content`, `.settings-section`, etc.) so both pages share
 * the same card-on-page rhythm without inventing a new layout system.
 *
 * Page contents are built section by section per the plan in
 * `ACTIVITY_DASHBOARD_PLAN.md`. This file holds the shell + section
 * scaffolding; each section's real content lands incrementally.
 */
interface ActivityDay {
  date: string;
  digests: number;
  checkin: boolean;
  repos: string[];
}

interface RepoStat {
  repo: string;
  digests: number;
  currentStreak: number;
  bestStreak: number;
  lastActive: string | null;
}

interface Personality {
  state: "hidden" | "placeholder" | "real" | "dormant";
  archetype: string | null;
  emoji: string;
  subheader: string;
  modifiers: string[];
}

interface InsightsData {
  bestStreak: { length: number; repo: string | null };
  totalDigests: number;
  activityDays: ActivityDay[];
  repoStats: RepoStat[];
  personality: Personality;
}

const EMPTY_PERSONALITY: Personality = {
  state: "hidden",
  archetype: null,
  emoji: "",
  subheader: "",
  modifiers: [],
};

const EMPTY_DATA: InsightsData = {
  bestStreak: { length: 0, repo: null },
  totalDigests: 0,
  activityDays: [],
  repoStats: [],
  personality: EMPTY_PERSONALITY,
};

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_LABEL_AT_ROW: Record<number, string> = {
  // Sun (0) and Sat (6) blank to keep the column tight. Mon/Wed/Fri
  // are the GitHub convention.
  1: "Mon",
  3: "Wed",
  5: "Fri",
};

interface Cell {
  /** YYYY-MM-DD or "" for padding cells (placeholders before the
   *  first day or after the last day in the rendered grid). */
  date: string;
  digests: number;
  checkin: boolean;
  repos: string[];
}

/** Slice the flat 365-day array into 53 weekly columns starting on
 *  Sunday. Pads the leading and trailing weeks with empty cells so
 *  every column is exactly 7 rows tall. */
function buildWeeks(days: ActivityDay[]): Cell[][] {
  if (days.length === 0) return [];
  const cells: Cell[] = days.map((d) => ({ ...d }));
  // Leading pad to the previous Sunday.
  const firstDow = new Date(cells[0]!.date + "T00:00:00").getDay();
  for (let i = 0; i < firstDow; i++) {
    cells.unshift({ date: "", digests: 0, checkin: false, repos: [] });
  }
  // Trailing pad to the next Saturday.
  while (cells.length % 7 !== 0) {
    cells.push({ date: "", digests: 0, checkin: false, repos: [] });
  }
  const weeks: Cell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

/** Month-label entries: emit a label for the first week-column where
 *  a new month appears, but only if that month has at least 2 weeks
 *  of visible data. Suppresses the leading-edge label (e.g. one week
 *  of last April that gets cut by the 365-day window) so it doesn't
 *  overlap with the second month's label, and keeps the full year's
 *  rhythm intact otherwise. The same month appearing at the trailing
 *  edge with multiple weeks (today's month) keeps its label. */
function buildMonthLabels(weeks: Cell[][]): Array<{ col: number; label: string }> {
  // First pass — collect month boundaries and how many weeks each
  // month spans within the visible window.
  type Range = { month: number; startCol: number; weekCount: number };
  const ranges: Range[] = [];
  let currentMonth = -1;
  weeks.forEach((week, col) => {
    const firstReal = week.find((c) => c.date);
    if (!firstReal) return;
    const month = new Date(firstReal.date + "T00:00:00").getMonth();
    if (month !== currentMonth) {
      ranges.push({ month, startCol: col, weekCount: 1 });
      currentMonth = month;
    } else {
      const last = ranges[ranges.length - 1]!;
      last.weekCount += 1;
    }
  });
  // Second pass — keep only ranges with ≥ 2 weeks of presence so
  // sliver-months at the leading edge don't crowd the next label.
  return ranges
    .filter((r) => r.weekCount >= 2)
    .map((r) => ({ col: r.startCol, label: MONTH_LABELS[r.month]! }));
}

/** What state should this cell render as? */
function cellState(cell: Cell): "padding" | "empty" | "checkin" | "active" {
  if (!cell.date) return "padding";
  if (cell.digests > 0) return "active";
  if (cell.checkin) return "checkin";
  return "empty";
}

/** Native-tooltip text for hovered cells. Padding cells get nothing
 *  so the user doesn't see a confusing "no data" hover for cells
 *  that aren't really days. Separator is the middle dot — matches
 *  the existing tooltip convention in the digest's bar-tooltips
 *  (e.g. "10:05am · 10:20am · 12:45pm"). */
function cellTooltip(cell: Cell): string | undefined {
  if (!cell.date) return undefined;
  const d = new Date(cell.date + "T00:00:00");
  const formatted = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  if (cell.digests > 0) {
    const reposLabel = cell.repos.length > 0 ? ` in ${cell.repos.join(", ")}` : "";
    return `${formatted} · ${cell.digests} ${cell.digests === 1 ? "digest" : "digests"}${reposLabel}`;
  }
  if (cell.checkin) {
    return `${formatted} · Quiet day check-in`;
  }
  return `${formatted} · No activity`;
}

/** Format a YYYY-MM-DD into a human-friendly relative string for the
 *  per-repo "Last active" column. Today / Yesterday / N days ago for
 *  the recent past, then a short calendar date for older entries. */
function formatLastActive(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  target.setHours(0, 0, 0, 0);
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  // Older than a week — show the actual date. Include the year only
  // when it's a different calendar year from today, to keep the
  // common case compact.
  const sameYear = target.getFullYear() === today.getFullYear();
  return target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
  });
}

function ReposBreakdown({ repoStats }: { repoStats: RepoStat[] }) {
  // Empty state: zero repos with activity yet. Render a single
  // placeholder row so the section still has presence on day-1
  // accounts but doesn't show a misleading empty table.
  if (repoStats.length === 0) {
    return (
      <div className="insights-repos">
        <p className="insights-repos-empty">
          No repos with activity yet. Generate a digest to start filling this in.
        </p>
      </div>
    );
  }
  return (
    <div className="insights-repos">
      {/* Header row — desktop only. Hides on mobile (cards take over). */}
      <div className="insights-repos-header" aria-hidden>
        <span>Repo</span>
        <span>Digests</span>
        <span>Current</span>
        <span>Best</span>
        <span>Last active</span>
      </div>
      {repoStats.map((r) => (
        <div className="insights-repos-row" key={r.repo}>
          <span className="insights-repos-cell" data-col="repo">
            <span className="insights-repos-cell-label">Repo</span>
            <span className="insights-repos-cell-value insights-repos-name" title={r.repo}>
              {r.repo}
            </span>
          </span>
          <span className="insights-repos-cell" data-col="digests">
            <span className="insights-repos-cell-label">Digests</span>
            <span className="insights-repos-cell-value">{r.digests}</span>
          </span>
          <span className="insights-repos-cell" data-col="current">
            <span className="insights-repos-cell-label">Current streak</span>
            <span className="insights-repos-cell-value">
              {r.currentStreak} {r.currentStreak === 1 ? "day" : "days"}
            </span>
          </span>
          <span className="insights-repos-cell" data-col="best">
            <span className="insights-repos-cell-label">Best streak</span>
            <span className="insights-repos-cell-value">
              {r.bestStreak} {r.bestStreak === 1 ? "day" : "days"}
            </span>
          </span>
          <span className="insights-repos-cell" data-col="last">
            <span className="insights-repos-cell-label">Last active</span>
            <span className="insights-repos-cell-value">{formatLastActive(r.lastActive)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function ActivityCalendar({ days }: { days: ActivityDay[] }) {
  const weeks = buildWeeks(days);
  const monthLabels = buildMonthLabels(weeks);

  return (
    <div className="insights-calendar">
      {/* Month labels row — positioned to the column where each new
          month first appears. */}
      <div className="insights-calendar-months" aria-hidden>
        {monthLabels.map((m) => (
          <span
            key={`${m.col}-${m.label}`}
            className="insights-calendar-month"
            style={{ gridColumn: m.col + 1 }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="insights-calendar-body">
        {/* Day-of-week labels on the left. Mon / Wed / Fri only —
            standard GitHub-style spacing. */}
        <div className="insights-calendar-day-labels" aria-hidden>
          {[0, 1, 2, 3, 4, 5, 6].map((row) => (
            <span key={row} className="insights-calendar-day-label">
              {DAY_LABEL_AT_ROW[row] ?? ""}
            </span>
          ))}
        </div>

        {/* The grid itself: 53 week-columns × 7 day-rows. */}
        <div className="insights-calendar-grid">
          {weeks.map((week, wi) => (
            <div key={wi} className="insights-calendar-week">
              {week.map((cell, di) => {
                const state = cellState(cell);
                const tooltip = cellTooltip(cell);
                return (
                  <div
                    key={di}
                    className="insights-calendar-cell"
                    data-state={state}
                    title={tooltip}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const [data, setData] = useState<InsightsData>(EMPTY_DATA);
  const [loaded, setLoaded] = useState(false);

  // Fetch insights data. The endpoint returns the same shape as
  // EMPTY_DATA so we always have valid state, even on a fresh
  // account with zero activity.
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/insights");
        if (res.ok) {
          const json = (await res.json()) as InsightsData;
          setData(json);
        }
      } catch {
        /* silent — leave EMPTY_DATA in place */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const goBack = () => router.push("/dashboard");

  return (
    <div className="settings-page">
      <div className="settings-card">
        {/* Header strip — mirrors settings/page.tsx exactly so the two
            sibling pages share the same arrival feel. */}
        <div className="settings-header">
          <div className="settings-header-left">
            <button type="button" className="settings-back-pill" onClick={goBack}>
              <ArrowLeft size={10} strokeWidth={1} aria-hidden />
              Back to Digest
            </button>
            <h1 className="settings-title">Insights</h1>
          </div>
          <button
            type="button"
            className="settings-close-btn"
            onClick={goBack}
            aria-label="Close insights"
          >
            <CircleX size={20} strokeWidth={1} aria-hidden />
            <span>Close</span>
          </button>
        </div>
        <hr className="settings-header-divider" />

        <div className="settings-content">
          {/* SNAPSHOT — two top-tier stats per the plan: best streak
              (with the repo it was achieved on) and total digests.
              Section is gated on `loaded` so users with real data
              don't see a brief flash of zeros before their numbers
              come in. Once loaded, zeros are themselves the valid
              empty state for fresh accounts. */}
          {loaded && (
            <section className="settings-section">
              <header className="settings-section-head">
                <div className="settings-section-title">
                  <Emoji name="snapshot" size={20} />
                  <h2>Snapshot</h2>
                </div>
                <p className="settings-section-desc">A quick look at your time with Scout.</p>
              </header>
              <div className="settings-panel insights-snapshot">
                <div className="insights-stat-cell">
                  <span className="insights-stat-label">Best streak</span>
                  <div className="insights-stat-value-row">
                    <span className="insights-stat-value">{data.bestStreak.length}</span>
                    <span className="insights-stat-unit">
                      {data.bestStreak.length === 1 ? "day" : "days"}
                    </span>
                  </div>
                  {/* Repo line only renders once the user has at least
                      one streak; on a fresh account it stays out of
                      the way. */}
                  {data.bestStreak.repo && (
                    <span className="insights-stat-detail">on {data.bestStreak.repo}</span>
                  )}
                </div>
                <div className="insights-stat-cell">
                  <span className="insights-stat-label">Total digests</span>
                  <div className="insights-stat-value-row">
                    <span className="insights-stat-value">{data.totalDigests}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ACTIVITY CALENDAR — rolling 365-day grid, GitHub-style.
              Aggregated across all repos. Empty cells = no activity;
              tinted = quiet-day check-in only; full-color = at least
              one digest that day. Hover any cell for date + count +
              repos. Renders even on fresh accounts (full empty grid)
              so users see what they're working toward. */}
          {loaded && (
            <section className="settings-section">
              <header className="settings-section-head">
                <div className="settings-section-title">
                  <Emoji name="calendar" size={20} />
                  <h2>Activity</h2>
                </div>
                <p className="settings-section-desc">Your last 365 days with Scout.</p>
              </header>
              <div className="settings-panel insights-calendar-panel">
                <ActivityCalendar days={data.activityDays} />
              </div>
            </section>
          )}

          {/* PER-REPO BREAKDOWN — table on desktop, stacked cards on
              mobile (≤ 768px) per the plan doc. Sorted by last
              active descending so the most recently touched repos
              surface first. Empty repo lists render an in-panel
              placeholder so the section still reads on day-1
              accounts. */}
          {loaded && (
            <section className="settings-section">
              <header className="settings-section-head">
                <div className="settings-section-title">
                  <Emoji name="perRepo" size={20} />
                  <h2>Repos</h2>
                </div>
                <p className="settings-section-desc">
                  Every repo Scout has tracked, with its activity at a glance.
                </p>
              </header>
              <div className="settings-panel insights-repos-panel">
                <ReposBreakdown repoStats={data.repoStats} />
              </div>
            </section>
          )}

          {/* ENGAGEMENT PERSONALITY — live-computed primary archetype
              + 2–3 modifier tags. Block hides entirely on accounts
              with zero digests (state === "hidden") so the rest of
              the page still loads but this card waits for data. */}
          {loaded && data.personality.state !== "hidden" && (
            <section className="settings-section">
              <header className="settings-section-head">
                <div className="settings-section-title">
                  <Emoji name="personality" size={20} />
                  <h2>Personality</h2>
                </div>
                <p className="settings-section-desc">
                  How you show up on Scout, recomputed every visit.
                </p>
              </header>
              <div
                className={`settings-panel insights-personality${
                  data.personality.state === "dormant" ? " is-dormant" : ""
                }`}
              >
                <div className="insights-personality-emoji" aria-hidden>
                  {data.personality.emoji}
                </div>
                <h3 className="insights-personality-name">{data.personality.archetype}</h3>
                <p className="insights-personality-subheader">
                  {data.personality.subheader}
                </p>
                {data.personality.modifiers.length > 0 && (
                  <p className="insights-personality-modifiers">
                    {data.personality.modifiers.join(" · ")}
                  </p>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
