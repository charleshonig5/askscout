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

interface InsightsData {
  bestStreak: { length: number; repo: string | null };
  totalDigests: number;
  activityDays: ActivityDay[];
}

const EMPTY_DATA: InsightsData = {
  bestStreak: { length: 0, repo: null },
  totalDigests: 0,
  activityDays: [],
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
 *  a new month appears. The leftmost cell of that column drives the
 *  position. */
function buildMonthLabels(weeks: Cell[][]): Array<{ col: number; label: string }> {
  const labels: Array<{ col: number; label: string }> = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const firstReal = week.find((c) => c.date);
    if (!firstReal) return;
    const month = new Date(firstReal.date + "T00:00:00").getMonth();
    if (month !== lastMonth) {
      labels.push({ col, label: MONTH_LABELS[month]! });
      lastMonth = month;
    }
  });
  return labels;
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
        </div>
      </div>
    </div>
  );
}
