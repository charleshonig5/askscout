import { auth, getUserId } from "@/auth";
import { supabase } from "@/lib/supabase";
import { computePersonality, type PersonalityResult } from "./personality";

/**
 * Insights API — aggregates everything the /insights page needs into one
 * payload. Built incrementally per ACTIVITY_DASHBOARD_PLAN.md:
 *
 *   Phase 1 (this commit): bestStreak + totalDigests
 *   Phase 2: activityDays for the calendar
 *   Phase 3: per-repo breakdown
 *   Phase 4: personality archetype + modifiers
 *
 * All scoped to the authenticated user. Reads only — no writes.
 */

interface BestStreakResult {
  length: number;
  /** Repo the streak was achieved on (the repo with the longest single
   *  consecutive run). Null when the user has no activity yet. */
  repo: string | null;
}

interface ActivityDay {
  /** YYYY-MM-DD in the server's local-time interpretation. */
  date: string;
  /** Number of digests generated on this day. */
  digests: number;
  /** True if there was a quiet-day check-in on this day. */
  checkin: boolean;
  /** Distinct repos with any activity on this day. */
  repos: string[];
}

interface RepoStat {
  repo: string;
  digests: number;
  currentStreak: number;
  bestStreak: number;
  /** YYYY-MM-DD of the most recent activity (digest or check-in),
   *  null only if neither exists for this repo. */
  lastActive: string | null;
}

interface InsightsResponse {
  bestStreak: BestStreakResult;
  totalDigests: number;
  /** Average digests per week since the user's first digest. Null
   *  only when the user has fewer than 2 total digests (a single
   *  digest can't produce a "per week" reading). */
  digestsPerWeek: number | null;
  /** Last 365 days, oldest first. Always exactly 365 entries — days
   *  with no activity render as zero-cell placeholders. */
  activityDays: ActivityDay[];
  /** One entry per repo the user has touched (digest or check-in).
   *  Sorted by lastActive descending. */
  repoStats: RepoStat[];
  /** Live-computed engagement personality. State drives whether the
   *  client renders the block at all (see `personality.ts`). */
  personality: PersonalityResult;
}

const EMPTY_PERSONALITY: PersonalityResult = {
  state: "hidden",
  archetype: null,
  archetypeKey: null,
  emoji: "",
  subheader: "",
};

const EMPTY: InsightsResponse = {
  bestStreak: { length: 0, repo: null },
  totalDigests: 0,
  digestsPerWeek: null,
  activityDays: [],
  repoStats: [],
  personality: EMPTY_PERSONALITY,
};

/** YYYY-MM-DD from a date or timestamp string. */
function dayKey(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Current consecutive-day run counting backward from today. Mirrors
 *  the dashboard's streak logic exactly: if today itself is empty,
 *  the streak picks up from yesterday and continues until the first
 *  break. Returns 0 for empty inputs. */
function currentRun(daySet: Set<string>, todayKey: string): number {
  if (daySet.size === 0) return 0;
  const today = new Date(todayKey + "T00:00:00");
  let count = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    if (daySet.has(key)) {
      count += 1;
    } else if (i === 0) {
      // Today itself doesn't have to be active for a "current" streak
      // to be alive — keep walking back.
      continue;
    } else {
      break;
    }
  }
  return count;
}

/** Longest consecutive-day run over a sorted array of YYYY-MM-DD strings. */
function longestRun(sortedDays: string[]): number {
  if (sortedDays.length === 0) return 0;
  const DAY_MS = 24 * 60 * 60 * 1000;
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + "T00:00:00");
    const curr = new Date(sortedDays[i] + "T00:00:00");
    const diff = Math.round((curr.getTime() - prev.getTime()) / DAY_MS);
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else if (diff > 1) {
      run = 1;
    }
  }
  return longest;
}

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return Response.json({ error: "Unable to identify user" }, { status: 401 });
  }
  if (!supabase) {
    // Supabase isn't configured in this env — return empty payload so the
    // page still renders its zero state cleanly instead of erroring out.
    return Response.json(EMPTY);
  }

  // Pull the minimum data needed for snapshot + calendar + personality.
  // Stats blob is included so personality.ts can compute style/session
  // signals from recent digests. Both queries scoped to user_id.
  const [digestsRes, checkinsRes] = await Promise.all([
    supabase.from("digests").select("repo, created_at, stats").eq("user_id", userId),
    supabase.from("daily_checkins").select("repo, date").eq("user_id", userId),
  ]);

  const digests = (digestsRes.data ?? []) as Array<{
    repo: string | null;
    created_at: string | null;
    stats: Record<string, unknown> | null;
  }>;
  const checkins = (checkinsRes.data ?? []) as Array<{
    repo: string | null;
    date: string | null;
  }>;

  const totalDigests = digests.length;

  // Best streak per repo: build a per-repo set of active YYYY-MM-DD days
  // (digest creation dates ∪ check-in dates), sort each, find longest
  // consecutive run. The winning repo is the one with the longest run.
  const daysByRepo = new Map<string, Set<string>>();
  for (const row of digests) {
    if (!row.repo || !row.created_at) continue;
    const set = daysByRepo.get(row.repo) ?? new Set<string>();
    set.add(dayKey(row.created_at));
    daysByRepo.set(row.repo, set);
  }
  for (const row of checkins) {
    if (!row.repo || !row.date) continue;
    const set = daysByRepo.get(row.repo) ?? new Set<string>();
    set.add(row.date);
    daysByRepo.set(row.repo, set);
  }

  // Per-repo digest counts (cheaper to do in one pass than re-walk).
  const digestCountByRepo = new Map<string, number>();
  for (const row of digests) {
    if (!row.repo) continue;
    digestCountByRepo.set(row.repo, (digestCountByRepo.get(row.repo) ?? 0) + 1);
  }

  // For each repo: compute bestStreak, currentStreak, lastActive, and
  // digest count. Track best-across-all-repos for the snapshot row.
  const todayKey = dayKey(new Date());
  const repoStats: RepoStat[] = [];
  let bestRun = 0;
  let bestRepo: string | null = null;
  for (const [repo, days] of daysByRepo) {
    const sorted = [...days].sort();
    const bestStreak = longestRun(sorted);
    const repoCurrent = currentRun(days, todayKey);
    const lastActive = sorted.length > 0 ? sorted[sorted.length - 1]! : null;
    repoStats.push({
      repo,
      digests: digestCountByRepo.get(repo) ?? 0,
      currentStreak: repoCurrent,
      bestStreak,
      lastActive,
    });
    if (bestStreak > bestRun) {
      bestRun = bestStreak;
      bestRepo = repo;
    }
  }
  // Sort by lastActive descending — most recently touched repos first.
  // Repos with no lastActive (shouldn't happen given how we built the
  // map, but defensive) sort to the bottom.
  repoStats.sort((a, b) => {
    if (a.lastActive === b.lastActive) return 0;
    if (!a.lastActive) return 1;
    if (!b.lastActive) return -1;
    return b.lastActive.localeCompare(a.lastActive);
  });

  // Calendar — build a 365-day window ending today. Initialize with
  // empty days so the client always gets a complete grid (even days
  // with zero activity render as placeholder cells). Then layer in
  // digests and check-ins.
  const today = new Date();
  const dayMap = new Map<string, ActivityDay>();
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = dayKey(d);
    dayMap.set(key, { date: key, digests: 0, checkin: false, repos: [] });
  }
  for (const row of digests) {
    if (!row.repo || !row.created_at) continue;
    const key = dayKey(row.created_at);
    const day = dayMap.get(key);
    if (!day) continue; // outside the 365-day window — fine
    day.digests += 1;
    if (!day.repos.includes(row.repo)) day.repos.push(row.repo);
  }
  for (const row of checkins) {
    if (!row.repo || !row.date) continue;
    const day = dayMap.get(row.date);
    if (!day) continue;
    day.checkin = true;
    if (!day.repos.includes(row.repo)) day.repos.push(row.repo);
  }
  const activityDays = Array.from(dayMap.values());

  // Engagement personality — live-computed every visit per the plan.
  // Pure function over the same data we already pulled above; nothing
  // about the user leaves this server boundary.
  const personality = computePersonality(digests, checkins, new Date());

  // Pace context for the Total digests stat — average per week since
  // the user's first digest. Suppressed only for the truly low-signal
  // case: fewer than 2 digests or zero span (avoids divide-by-zero).
  // For 2 digests on the same day we still need a span floor of 1 day
  // so the per-week math doesn't explode.
  let digestsPerWeek: number | null = null;
  if (totalDigests >= 2) {
    const timestamps = digests
      .map((d) => (d.created_at ? new Date(d.created_at).getTime() : NaN))
      .filter((t) => !Number.isNaN(t));
    if (timestamps.length > 0) {
      const first = Math.min(...timestamps);
      const spanDays = Math.max(1, (Date.now() - first) / (24 * 60 * 60 * 1000));
      digestsPerWeek = totalDigests / (spanDays / 7);
    }
  }

  const payload: InsightsResponse = {
    bestStreak: { length: bestRun, repo: bestRepo },
    totalDigests,
    digestsPerWeek,
    activityDays,
    repoStats,
    personality,
  };

  return Response.json(payload);
}
