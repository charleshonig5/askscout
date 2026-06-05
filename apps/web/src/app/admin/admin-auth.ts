import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/* Second-factor admin gate.
 *
 * The first factor is NextAuth (session.user.id === ADMIN_USER_ID),
 * enforced in app/admin/page.tsx. This module adds an independent
 * second factor: a password the operator must enter once per session
 * (browser session — cookie is non-persistent), with the unlock
 * receipt stored as an HMAC-signed cookie so the password is never
 * itself stored, transmitted on every request, or readable from JS.
 *
 * Cookie format: `<unix_ms>.<hmac>` where
 *   hmac = HMAC-SHA256(unix_ms, ADMIN_SECRET).
 * On every /admin request we re-derive the hmac and constant-time
 * compare. Also enforces a 24h max age server-side so a stolen
 * cookie can't grant indefinite access.
 *
 * The cookie name uses the __Host- prefix per RFC 6265bis, which
 * tells modern browsers to reject the cookie unless it's Secure +
 * Path=/ + no Domain attribute. This prevents subdomain takeover
 * attacks from leaking the admin session. */

export const ADMIN_COOKIE_NAME = "__Host-admin_unlock";

/* 24-hour max age in milliseconds. The cookie itself is a session
 * cookie (no Max-Age) so browser-close clears it; this server-side
 * check is the fallback if the cookie somehow persists. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function getSecret(): string | null {
  // Reuse the existing AUTH_SECRET if no dedicated ADMIN_SECRET is
  // set. AUTH_SECRET is already a strong random required for the
  // app to boot, so this avoids forcing the operator to set a new
  // env var just for the admin gate.
  return process.env.ADMIN_SECRET ?? process.env.AUTH_SECRET ?? null;
}

/** Constant-time string compare via Buffer.timingSafeEqual.
 *  Pads to equal length first since timingSafeEqual throws on
 *  mismatched lengths (which is itself a timing leak). */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  const max = Math.max(ba.length, bb.length);
  const pa = Buffer.alloc(max);
  const pb = Buffer.alloc(max);
  ba.copy(pa);
  bb.copy(pb);
  // The final length-equal check is what produces the actual
  // mismatch signal — the timingSafeEqual above runs in constant
  // time regardless of byte differences.
  return timingSafeEqual(pa, pb) && ba.length === bb.length;
}

/** Verify a submitted password against ADMIN_PASSWORD. */
export function verifyAdminPassword(submitted: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(submitted, expected);
}

/** Mint a signed unlock token: `<unix_ms>.<hmac>`. */
export function mintAdminCookieValue(): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const ts = Date.now().toString();
  const hmac = createHmac("sha256", secret).update(ts).digest("hex");
  return `${ts}.${hmac}`;
}

/** Verify a signed unlock token. Returns true iff:
 *  - format is `<digits>.<hex>`
 *  - HMAC reconstructs to the same digest
 *  - timestamp is within the last 24h
 *  Never throws — returns false on any malformed input. */
export function verifyAdminCookieValue(value: string | undefined): boolean {
  if (!value) return false;
  const secret = getSecret();
  if (!secret) return false;
  const dot = value.indexOf(".");
  if (dot < 0) return false;
  const ts = value.slice(0, dot);
  const hmac = value.slice(dot + 1);
  if (!/^\d+$/.test(ts) || !/^[a-f0-9]{64}$/.test(hmac)) return false;
  const expected = createHmac("sha256", secret).update(ts).digest("hex");
  if (!safeEqual(expected, hmac)) return false;
  const age = Date.now() - Number(ts);
  if (age < 0 || age > MAX_AGE_MS) return false;
  return true;
}
