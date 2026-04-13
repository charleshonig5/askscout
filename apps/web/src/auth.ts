import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

/**
 * Get a stable user ID from the session. Returns null if no valid
 * identity is available — callers should return 401 instead of
 * writing data under a shared "unknown" key.
 */
export function getUserId(session: {
  user?: { id?: string; email?: string | null };
}): string | null {
  return session.user?.id ?? session.user?.email ?? null;
}
