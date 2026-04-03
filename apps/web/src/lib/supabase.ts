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
