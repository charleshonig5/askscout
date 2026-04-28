import { auth, getUserId } from "@/auth";
import { supabase } from "@/lib/supabase";

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

interface InsightsResponse {
  bestStreak: BestStreakResult;
  totalDigests: number;
  /** Last 365 days, oldest first. Always exactly 365 entries — days
   *  with no activity render as zero-cell placeholders. */
  activityDays: ActivityDay[];
}

const EMPTY: InsightsResponse = {
  bestStreak: { length: 0, repo: null },
  totalDigests: 0,
  activityDays: [],
};

/** YYYY-MM-DD from a date or timestamp string. */
function dayKey(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

  // Pull the minimum data needed for snapshot stats. Both queries are
  // scoped to user_id.
  const [digestsRes, checkinsRes] = await Promise.all([
    supabase.from("digests").select("repo, created_at").eq("user_id", userId),
    supabase.from("daily_checkins").select("repo, date").eq("user_id", userId),
  ]);

  const digests = (digestsRes.data ?? []) as Array<{
    repo: string | null;
    created_at: string | null;
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

  let bestRun = 0;
  let bestRepo: string | null = null;
  for (const [repo, days] of daysByRepo) {
    const sorted = [...days].sort();
    const run = longestRun(sorted);
    if (run > bestRun) {
      bestRun = run;
      bestRepo = repo;
    }
  }

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

  const payload: InsightsResponse = {
    bestStreak: { length: bestRun, repo: bestRepo },
    totalDigests,
    activityDays,
  };

  return Response.json(payload);
}
