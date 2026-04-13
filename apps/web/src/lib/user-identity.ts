/**
 * Get a stable user ID from a session. Returns null if no valid
 * identity is available — callers should return 401 instead of
 * writing data under a shared "unknown" key.
 *
 * This is a standalone utility (no NextAuth dependency) so it
 * can be tested without mocking the Next.js server environment.
 */
export function getUserId(session: {
  user?: { id?: string; email?: string | null };
}): string | null {
  return session.user?.id ?? session.user?.email ?? null;
}
