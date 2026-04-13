/**
 * Rate limiting for askscout.
 *
 * Digest rate limits use Supabase (counting saved digests), so they
 * persist across Vercel instances and cold starts.
 *
 * Repo listing uses a simple in-memory limiter (low-risk, fires often,
 * doesn't need cross-instance persistence).
 */

import { supabase } from "./supabase";

// ============================================
// Supabase-backed rate limiting (for digests)
// ============================================

interface DigestRateLimitResult {
  allowed: boolean;
  remaining: number;
}

/**
 * Check digest rate limits by counting recent digests in Supabase.
 * Shared across all Vercel instances — no cold-start reset.
 */
export async function checkDigestRateLimit(userId: string): Promise<{
  hourly: DigestRateLimitResult;
  daily: DigestRateLimitResult;
}> {
  if (!supabase) {
    return {
      hourly: { allowed: true, remaining: 10 },
      daily: { allowed: true, remaining: 30 },
    };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [hourlyResult, dailyResult] = await Promise.all([
    supabase
      .from("digests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", hourAgo),
    supabase
      .from("digests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", dayAgo),
  ]);

  const hourlyCount = hourlyResult.count ?? 0;
  const dailyCount = dailyResult.count ?? 0;

  return {
    hourly: {
      allowed: hourlyCount < 10,
      remaining: Math.max(0, 10 - hourlyCount),
    },
    daily: {
      allowed: dailyCount < 30,
      remaining: Math.max(0, 30 - dailyCount),
    },
  };
}

// ============================================
// In-memory rate limiting (for repo listing)
// ============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  },
  5 * 60 * 1000,
);

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

export const RATE_LIMITS = {
  reposPerMinute: { limit: 30, windowMs: 60 * 1000 },
} as const;
