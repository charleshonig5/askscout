import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("[askscout] Supabase not configured. History will not be saved.");
}

/** Server-side Supabase client using service_role key */
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface DigestRecord {
  id: string;
  user_id: string;
  repo: string;
  mode: string;
  content: string;
  stats: Record<string, unknown> | null;
  created_at: string;
}

// ============================================
// User Settings
// ============================================

export interface DigestSections {
  vibeCheck: boolean;
  shipped: boolean;
  changed: boolean;
  unstable: boolean;
  leftOff: boolean;
  oneTakeaway: boolean;
  statistics: boolean;
  mostActiveFiles: boolean;
  whenYouCoded: boolean;
  paceCheck: boolean;
  codebaseHealth: boolean;
}

export const DEFAULT_SECTIONS: DigestSections = {
  vibeCheck: true,
  shipped: true,
  changed: true,
  unstable: true,
  leftOff: true,
  oneTakeaway: true,
  statistics: true,
  mostActiveFiles: true,
  whenYouCoded: true,
  paceCheck: true,
  codebaseHealth: true,
};

export interface UserSettings {
  default_repo: string | null;
  digest_sections: DigestSections | null;
}

/** Get user settings */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  if (!supabase) return { default_repo: null, digest_sections: null };
  const { data } = await supabase
    .from("user_settings")
    .select("default_repo, digest_sections")
    .eq("user_id", userId)
    .single();
  if (!data) return { default_repo: null, digest_sections: null };
  return {
    default_repo: (data.default_repo as string) ?? null,
    digest_sections: (data.digest_sections as DigestSections) ?? null,
  };
}

/** Save user settings (upsert) */
export async function saveUserSettings(
  userId: string,
  settings: Partial<UserSettings>,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: userId, ...settings, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) console.error("[askscout] Failed to save settings:", error.message);
}

/** Delete all digests for a user (all repos). Also clears daily check-ins. */
export async function deleteAllDigests(userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("digests").delete().eq("user_id", userId);
  if (error) console.error("[askscout] Failed to delete digests:", error.message);
  // Streak data lives in check-ins too; clear those so the streak truly resets.
  await supabase.from("daily_checkins").delete().eq("user_id", userId);
}

/** Delete digests for a specific repo */
export async function deleteRepoDigests(userId: string, repo: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("digests").delete().eq("user_id", userId).eq("repo", repo);
  if (error) console.error("[askscout] Failed to delete repo digests:", error.message);
  // Also clear the project summary and daily check-ins for this repo
  await supabase.from("project_summaries").delete().eq("user_id", userId).eq("repo", repo);
  await supabase.from("daily_checkins").delete().eq("user_id", userId).eq("repo", repo);
}

/** Delete user account entirely (settings + all digests + summaries + checkins) */
export async function deleteUserAccount(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from("digests").delete().eq("user_id", userId);
  await supabase.from("project_summaries").delete().eq("user_id", userId);
  await supabase.from("user_settings").delete().eq("user_id", userId);
  await supabase.from("daily_checkins").delete().eq("user_id", userId);
}

// ============================================
// Daily Check-ins (streak preservation on rest days)
// ============================================

/**
 * Record a "quiet day check-in" for a user+repo+date. Upserts on conflict so
 * repeated visits in the same day are idempotent. Date is the user's LOCAL
 * calendar date in YYYY-MM-DD form — the client sends it so timezone math
 * stays consistent with how the streak is displayed.
 */
export async function recordDailyCheckin(
  userId: string,
  repo: string,
  checkinDate: string,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("daily_checkins")
    .upsert(
      { user_id: userId, repo, checkin_date: checkinDate },
      { onConflict: "user_id,repo,checkin_date" },
    );
  if (error) console.error("[askscout] Failed to record check-in:", error.message);
}

/** Get all check-in dates (last 60 days) for a user+repo. Returns YYYY-MM-DD strings. */
export async function getCheckinDates(userId: string, repo: string): Promise<string[]> {
  if (!supabase) return [];
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("daily_checkins")
    .select("checkin_date")
    .eq("user_id", userId)
    .eq("repo", repo)
    .gte("checkin_date", sixtyDaysAgo);
  if (error || !data) return [];
  return data.map((d) => d.checkin_date as string);
}

// ============================================
// Project Summaries (persistent context across sessions)
// ============================================

/** Get the persistent project summary for a user+repo */
export async function getProjectSummary(
  userId: string,
  repo: string,
): Promise<{ summary: string; runCount: number } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("project_summaries")
    .select("summary, run_count")
    .eq("user_id", userId)
    .eq("repo", repo)
    .single();
  if (error || !data) return null;
  return { summary: data.summary as string, runCount: data.run_count as number };
}

/** Save or update the persistent project summary for a user+repo */
export async function saveProjectSummary(
  userId: string,
  repo: string,
  summary: string,
): Promise<void> {
  if (!supabase) return;
  // Try to get existing run_count to increment it
  const existing = await getProjectSummary(userId, repo);
  const newRunCount = (existing?.runCount ?? 0) + 1;
  const { error } = await supabase.from("project_summaries").upsert(
    {
      user_id: userId,
      repo,
      summary,
      run_count: newRunCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,repo" },
  );
  if (error) console.error("[askscout] Failed to save project summary:", error.message);
}

// ============================================
// Digests
// ============================================

/** Save a completed digest to the database */
export async function saveDigest(
  userId: string,
  repo: string,
  mode: string,
  content: string,
  stats: Record<string, unknown> | null,
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from("digests")
    .insert({ user_id: userId, repo, mode, content, stats });
  if (error) console.error("[askscout] Failed to save digest:", error.message);
}

/** Get the most recent digest for a user+repo to determine last run time */
export async function getLastRunTime(userId: string, repo: string): Promise<Date | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("digests")
    .select("created_at")
    .eq("user_id", userId)
    .eq("repo", repo)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return new Date(data.created_at as string);
}

/** Get today's digest for a user+repo+mode if one exists */
export async function getTodaysDigest(
  userId: string,
  repo: string,
  mode: string,
  tzOffsetMinutes?: number,
): Promise<DigestRecord | null> {
  if (!supabase) return null;
  // Calculate midnight in the user's timezone using their offset
  // tzOffsetMinutes: e.g. -420 for PDT (UTC-7), 0 for UTC, 60 for CET
  const offset = tzOffsetMinutes ?? 0;
  const nowUtc = Date.now();
  const nowLocal = nowUtc - offset * 60 * 1000;
  const midnightLocal = new Date(nowLocal);
  midnightLocal.setUTCHours(0, 0, 0, 0);
  const todayStart = new Date(midnightLocal.getTime() + offset * 60 * 1000);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { data, error } = await supabase
    .from("digests")
    .select("*")
    .eq("user_id", userId)
    .eq("repo", repo)
    .eq("mode", mode)
    .gte("created_at", todayStart.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return null;
  return data as DigestRecord;
}

/** Get digest history for a user+repo (last 30 days) */
export async function getDigestHistory(userId: string, repo: string): Promise<DigestRecord[]> {
  if (!supabase) return [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("digests")
    .select("*")
    .eq("user_id", userId)
    .eq("repo", repo)
    .eq("mode", "digest")
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as DigestRecord[];
}
