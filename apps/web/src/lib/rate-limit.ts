/**
 * Simple in-memory rate limiter.
 * For production at scale, swap this for Redis-based limiting.
 * This works fine for a single Vercel serverless instance.
 */

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
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a request is within rate limits.
 * Returns whether the request is allowed and how many remain.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  // No entry or expired window, start fresh
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt };
  }

  // Within window, check count
  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  // Increment and allow
  entry.count++;
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/** Rate limit presets */
export const RATE_LIMITS = {
  /** Digest generation: 10 per hour per user */
  digestPerHour: { limit: 10, windowMs: 60 * 60 * 1000 },
  /** Digest generation: 30 per day per user */
  digestPerDay: { limit: 30, windowMs: 24 * 60 * 60 * 1000 },
  /** Repo listing: 30 per minute per user */
  reposPerMinute: { limit: 30, windowMs: 60 * 1000 },
} as const;
