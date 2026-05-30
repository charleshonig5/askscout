"use server";

/**
 * Server-action sign-out.
 *
 * The client-side `signOut` from `next-auth/react` was leaving the
 * session cookie intact in production — symptom was: click Sign out,
 * land on "/", root page's server-component `auth()` still sees a
 * session, redirects to /dashboard, user is back where they started.
 *
 * Switching to the server-side `signOut` exported from `@/auth` makes
 * Auth.js clear the cookie via Next's own `cookies()` API in the same
 * request that produces the redirect response. There's no client
 * fetch, no CSRF token round-trip, no SessionProvider state that
 * needs to settle — by the time the browser receives the redirect,
 * the Set-Cookie max-age=0 header is already attached and committed.
 *
 * `redirectTo: "/"` lands the user on the marketing home (the
 * unauthenticated landing). Auth.js throws a Next-typed redirect
 * internally; we don't need to call `redirect()` ourselves.
 */

import { signOut } from "@/auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
