/**
 * Get a stable user ID from a session. Returns null if no valid
 * identity is available — callers should return 401 instead of
 * writing data under a shared "unknown" key.
 *
 * Only reads `session.user.id` — pinned to GitHub's permanent
 * providerAccountId by the JWT/session callback in auth.config.ts.
 * There is intentionally NO email fallback: two GitHub accounts
 * that share an email (or an account that changed its email)
 * would otherwise collide on the same DB rows, silently
 * cross-contaminating digests, settings, and history.
 *
 * Standalone utility (no NextAuth dependency) so it can be tested
 * without mocking the Next.js server environment.
 */
export function getUserId(session: {
  user?: { id?: string };
}): string | null {
  return session.user?.id ?? null;
}
