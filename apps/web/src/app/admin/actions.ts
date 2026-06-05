"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ADMIN_COOKIE_NAME, mintAdminCookieValue, verifyAdminPassword } from "./admin-auth";

/* Server action that processes the password form on /admin.
 *
 * Failure modes (all return early, no cookie set):
 *   - Not signed in as the admin user (first factor failed)
 *   - Password missing or wrong (second factor failed)
 *   - Server-side ADMIN_SECRET / AUTH_SECRET unset (signing key
 *     missing — silently fail-closed, never accept blind unlocks)
 *
 * Success: sets the __Host-admin_unlock cookie and redirects to
 * /admin so the now-authenticated page can render. */
export async function unlockAdmin(formData: FormData): Promise<void> {
  // First factor: still must be the admin user. Belt-and-suspenders
  // — page.tsx checks this too, but enforcing it in the action
  // means a leaked password alone can never set an unlock cookie.
  const session = await auth();
  const adminUserId = process.env.ADMIN_USER_ID;
  if (!session?.user?.id || !adminUserId || session.user.id !== adminUserId) {
    redirect("/admin?error=auth");
  }

  // Second factor: the password.
  const submitted = formData.get("password");
  if (typeof submitted !== "string" || !verifyAdminPassword(submitted)) {
    redirect("/admin?error=password");
  }

  const value = mintAdminCookieValue();
  if (!value) {
    // Signing key not configured — fail closed rather than minting
    // an unsigned token that anyone could forge.
    redirect("/admin?error=config");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, value, {
    // __Host- prefix REQUIRES Secure + Path=/ + no Domain.
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    // No maxAge / expires → browser-session cookie. Browser close
    // clears it. The 24h max age enforced in verifyAdminCookieValue
    // is the server-side fallback if the cookie somehow persists.
  });

  redirect("/admin");
}
