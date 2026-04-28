"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  CircleX,
} from "lucide-react";
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

/** Month-label entries with full column range. Each label spans the
 *  weeks that month occupies in the calendar so the rendered text
 *  can be centered over its actual range — keeps months visually
 *  even even though months have different week-counts. Sliver
 *  months (<2 weeks visible) are dropped so the leading-edge cut
 *  doesn't crowd the next label. */
function buildMonthLabels(
  weeks: Cell[][],
): Array<{ startCol: number; weekCount: number; label: string }> {
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
  return ranges
    .filter((r) => r.weekCount >= 2)
    .map((r) => ({
      startCol: r.startCol,
      weekCount: r.weekCount,
      label: MONTH_LABELS[r.month]!,
    }));
}

/** What state should this cell render as? */
function cellState(cell: Cell): "padding" | "empty" | "checkin" | "active" {
  if (!cell.date) return "padding";
  if (cell.digests > 0) return "active";
  if (cell.checkin) return "checkin";
  return "empty";
}

/** Short calendar date for the tooltip label ("Apr 28"). */
function shortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Tooltip value text — count for digest days, "Quiet check-in" for
 *  check-in-only days. Empty cells never reach this function. */
function tooltipValue(cell: Cell): string {
  if (cell.digests > 0) {
    return `${cell.digests} ${cell.digests === 1 ? "digest" : "digests"}`;
  }
  return "Quiet check-in";
}

/** aria-label for cells. Padding + empty cells get nothing; active
 *  + check-in cells get a descriptive label for screen readers. */
function cellAriaLabel(cell: Cell): string | undefined {
  if (!cell.date) return undefined;
  if (cell.digests === 0 && !cell.checkin) return undefined;
  const d = new Date(cell.date + "T00:00:00");
  const fullDate = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return `${fullDate}, ${tooltipValue(cell)}`;
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

/** Strip the `owner/` prefix from a repo slug so the table only
 *  shows the actual repo name. Long owner prefixes (e.g.
 *  `some-org-name/`) ate column space and got truncated mid-name.
 *  The full slug stays available via title attribute on hover. */
function repoDisplayName(slug: string): string {
  const slash = slug.lastIndexOf("/");
  return slash === -1 ? slug : slug.slice(slash + 1);
}

type SortKey = "name" | "digests" | "currentStreak" | "lastActive";
type SortDir = "asc" | "desc";

/** Default sort direction for a given column when the user clicks it
 *  for the first time. Name is alphabetical (A→Z); numeric/date
 *  columns default to "highest first" since that's what users want
 *  when ranking. */
const DEFAULT_DIR: Record<SortKey, SortDir> = {
  name: "asc",
  digests: "desc",
  currentStreak: "desc",
  lastActive: "desc",
};

function ReposBreakdown({ repoStats }: { repoStats: RepoStat[] }) {
  // sortKey === null means "no active sort" — table renders in the
  // app default (lastActive desc) and no column header is
  // highlighted. Three-state cycle: inactive → default direction →
  // flipped → back to inactive (clear).
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const list = [...repoStats];
    // When no explicit sort is active, fall back to the page default
    // so the table never renders in arbitrary order.
    const effectiveKey: SortKey = sortKey ?? "lastActive";
    const effectiveDir: SortDir = sortKey ? sortDir : "desc";
    list.sort((a, b) => {
      let cmp = 0;
      switch (effectiveKey) {
        case "name":
          cmp = a.repo.localeCompare(b.repo, undefined, { sensitivity: "base" });
          break;
        case "digests":
          cmp = a.digests - b.digests;
          break;
        case "currentStreak":
          cmp = a.currentStreak - b.currentStreak;
          break;
        case "lastActive":
          if (a.lastActive === b.lastActive) cmp = 0;
          else if (!a.lastActive) cmp = 1;
          else if (!b.lastActive) cmp = -1;
          else cmp = a.lastActive.localeCompare(b.lastActive);
          break;
      }
      return effectiveDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [repoStats, sortKey, sortDir]);

  /** Three-state cycle on click: inactive → default direction →
   *  flipped → back to inactive. Standard data-grid behavior so
   *  users can return to the page default by clicking the active
   *  column a third time. */
  const handleSort = (key: SortKey) => {
    if (key !== sortKey) {
      setSortKey(key);
      setSortDir(DEFAULT_DIR[key]);
      return;
    }
    if (sortDir === DEFAULT_DIR[key]) {
      // Same column, on default direction → flip.
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      // Same column, on flipped direction → clear sort.
      setSortKey(null);
    }
  };

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

  /** One header cell — click to sort, click again to flip direction.
   *  Two stacked chevrons (standard data-grid pattern, à la Material
   *  UI / AG Grid). Both visible at all times; the active half lights
   *  up to indicate direction. Same shape in every state — no icon
   *  shape-shifting between sorted and unsorted. */
  const SortHeader = ({ keyName, label }: { keyName: SortKey; label: string }) => {
    const isActive = sortKey === keyName;
    const upActive = isActive && sortDir === "asc";
    const downActive = isActive && sortDir === "desc";
    return (
      <button
        type="button"
        className={`insights-repos-sort${isActive ? " is-active" : ""}`}
        onClick={() => handleSort(keyName)}
        aria-label={`Sort by ${label}`}
        aria-sort={isActive ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
      >
        <span className="insights-repos-sort-label">{label}</span>
        <span className="insights-repos-sort-icon" aria-hidden>
          <ChevronUp
            size={10}
            strokeWidth={2}
            className={upActive ? "is-on" : ""}
          />
          <ChevronDown
            size={10}
            strokeWidth={2}
            className={downActive ? "is-on" : ""}
          />
        </span>
      </button>
    );
  };

  return (
    <div className="insights-repos">
      {/* Header row — desktop only. Hides on mobile (cards take over).
          Each header is a button that sorts the table by that column;
          clicking the active column flips direction. */}
      <div className="insights-repos-header" role="row">
        <SortHeader keyName="name" label="Repo" />
        <SortHeader keyName="digests" label="Digests" />
        <SortHeader keyName="currentStreak" label="Current streak" />
        <SortHeader keyName="lastActive" label="Last active" />
      </div>
      {sorted.map((r) => (
        <div className="insights-repos-row" key={r.repo}>
          <span className="insights-repos-cell" data-col="repo">
            <span className="insights-repos-cell-label">Repo</span>
            <span className="insights-repos-cell-value insights-repos-name" title={r.repo}>
              {repoDisplayName(r.repo)}
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

  // Custom hover-tooltip state. Uses `position: fixed` for the
  // tooltip so it escapes the panel's overflow-x: auto clipping
  // (necessary for narrow viewports). Tracks the hovered cell and
  // its on-screen anchor position; onMouseEnter sets, onMouseLeave
  // clears. Padding cells (no date) intentionally don't trigger the
  // tooltip — they're not real days.
  const [hover, setHover] = useState<{
    cell: Cell;
    x: number;
    y: number;
  } | null>(null);

  const onCellEnter = (cell: Cell, target: HTMLElement) => {
    // Only trigger hover for cells with real activity. Empty days
    // (no digest, no check-in) and padding cells stay silent —
    // hovering them was just noise.
    if (!cell.date) return;
    if (cell.digests === 0 && !cell.checkin) return;
    const rect = target.getBoundingClientRect();
    setHover({
      cell,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const onCellLeave = () => setHover(null);

  return (
    <div className="insights-calendar">
      {/* Month labels row — each label spans its full month-of-weeks
          range and centers within it, so the labels stay visually
          even regardless of how many weeks each month occupies. */}
      <div className="insights-calendar-months" aria-hidden>
        {monthLabels.map((m) => (
          <span
            key={`${m.startCol}-${m.label}`}
            className="insights-calendar-month"
            style={{ gridColumn: `${m.startCol + 1} / span ${m.weekCount}` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      {/* The grid itself: 53 week-columns × 7 day-rows. Day-of-week
          labels were dropped — the panel is too narrow to spend
          ~26px on them, and the custom tooltip below names the day
          on hover for anyone who needs it. */}
      <div className="insights-calendar-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="insights-calendar-week">
            {week.map((cell, di) => {
              const state = cellState(cell);
              return (
                <div
                  key={di}
                  className="insights-calendar-cell"
                  data-state={state}
                  onMouseEnter={(e) => onCellEnter(cell, e.currentTarget)}
                  onMouseLeave={onCellLeave}
                  aria-label={cellAriaLabel(cell)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Custom tooltip — mirrors the .streak-tooltip pattern
          exactly (10px Light label + Medium value, glass surface,
          inset glow, 5px backdrop blur). Position: fixed escapes
          the panel's overflow clipping; centered above the hovered
          cell. Only triggers for active or check-in cells (see
          onCellEnter). */}
      {hover && (
        <div
          className="insights-calendar-tooltip"
          role="tooltip"
          style={{ left: hover.x, top: hover.y }}
        >
          <span className="insights-calendar-tooltip-label">{shortDate(hover.cell.date)}</span>
          <span className="insights-calendar-tooltip-value">{tooltipValue(hover.cell)}</span>
        </div>
      )}
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
                    {/* Repo chip sits inline with the value + unit
                        ("47 days [chip]") — same .digest-repo-chip
                        primitive used in the dashboard header,
                        links out to GitHub. Only renders once the
                        user actually has a streak. */}
                    {data.bestStreak.repo && (
                      <a
                        href={`https://github.com/${data.bestStreak.repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="digest-repo-chip"
                        aria-label={`Open ${data.bestStreak.repo} on GitHub`}
                      >
                        {repoDisplayName(data.bestStreak.repo)}
                        <ArrowUpRight size={10} strokeWidth={1} aria-hidden />
                      </a>
                    )}
                  </div>
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
            <>
              <hr className="settings-divider" />
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
            </>
          )}

          {/* PER-REPO BREAKDOWN — table on desktop, stacked cards on
              mobile (≤ 768px) per the plan doc. Sorted by last
              active descending so the most recently touched repos
              surface first. Empty repo lists render an in-panel
              placeholder so the section still reads on day-1
              accounts. */}
          {loaded && (
            <>
              <hr className="settings-divider" />
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
            </>
          )}

          {/* ENGAGEMENT PERSONALITY — live-computed primary archetype
              + 2–3 modifier tags. Block hides entirely on accounts
              with zero digests (state === "hidden") so the rest of
              the page still loads but this card waits for data. */}
          {loaded && data.personality.state !== "hidden" && (
            <>
              <hr className="settings-divider" />
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
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
