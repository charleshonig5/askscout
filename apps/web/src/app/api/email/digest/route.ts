/**
 * POST /api/email/digest
 *
 * Sends the digest that the user is currently looking at to their
 * GitHub primary email via Resend. User-initiated (button click) —
 * not a cron, not a scheduled job.
 *
 * Auth surface:
 *   - Requires an active NextAuth session.
 *   - Origin header CSRF check (same pattern as /api/account DELETE).
 *   - Requires session.user.email — populated by the JWT/session
 *     callbacks once the OAuth `user:email` scope has been granted.
 *     Existing sessions issued before the scope was added will need
 *     to sign out and back in; we surface a specific error code so
 *     the UI can prompt for it cleanly.
 *
 * Rate limit:
 *   - 1 send per digest row per hour, enforced via the
 *     digests.last_emailed_at column. This protects the user (no
 *     accidental double-send if the button stutters) and our Resend
 *     quota (no client-side infinite loop can DOS our sending domain).
 *
 * Body shape — one of:
 *   { digestId: string }                              // history view
 *   { repo: string; mode?: string; tzOffset?: number } // today view
 *
 * The digest text, stats, and repo are fetched server-side — the
 * client deliberately does not pass rendered content, so a
 * compromised client cannot spoof email body content sent from our
 * verified domain.
 */

import { auth, getUserId } from "@/auth";
import {
  getDigestByIdForUser,
  getDigestEmailedAt,
  markDigestEmailed,
  getUserSettings,
  getTodaysDigest,
} from "@/lib/supabase";
import { digestTextToEmailProps } from "@/lib/email/digest-text-to-props";
import { sendDigestEmail } from "@/lib/email/send-digest";

const ONE_HOUR_MS = 60 * 60 * 1000;

export async function POST(req: Request) {
  // Defense-in-depth CSRF: reject cross-origin even before checking
  // session. SameSite=Lax cookies already block this in current
  // browsers, but the explicit check means a future cookie-policy
  // change can't silently regress.
  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  if (origin !== null && origin !== url.origin) {
    return Response.json({ error: "Cross-origin request blocked" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return Response.json({ error: "Unable to identify user" }, { status: 401 });
  }

  // Email is the whole point of this route — refuse loudly if missing
  // so the UI can prompt the user to re-authenticate (the OAuth
  // user:email scope was added after this route shipped, so any
  // session issued before the scope-bump will land here).
  const recipientEmail = session.user?.email;
  if (!recipientEmail || typeof recipientEmail !== "string") {
    return Response.json(
      {
        error: "missing_email_scope",
        message:
          "We don't have your email address yet. Sign out and back in to grant the new permission.",
      },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const digestId = typeof b.digestId === "string" ? b.digestId : null;
  const repo = typeof b.repo === "string" ? b.repo : null;
  const mode = typeof b.mode === "string" ? b.mode : "digest";
  const tzOffset = typeof b.tzOffset === "number" ? b.tzOffset : undefined;

  // Resolve which digest to email. `digestId` wins when present (history
  // view passes it directly); otherwise we fall back to "today's digest
  // for this repo+mode in the user's local day," matching what the
  // dashboard's live view is currently showing.
  const digest = digestId
    ? await getDigestByIdForUser(digestId, userId)
    : repo
      ? await getTodaysDigest(userId, repo, mode, tzOffset)
      : null;
  if (!digest) {
    return Response.json(
      { error: digestId ? "Digest not found" : "No digest found for today" },
      { status: 404 },
    );
  }

  // Per-digest rate limit: one send per hour. Stops the button from
  // flooding the user's inbox (or our Resend quota) if it's wired up
  // wrong or clicked repeatedly while in flight. The window is
  // intentionally generous — this is on-demand UX, not a marketing
  // blast, so accidental repeat-clicks are the only realistic threat.
  //
  // Bypass: pass `?force=1` to skip the rate limit when iterating on
  // the template. Gated to non-production (local dev OR Vercel preview
  // deploys) so it's safe to hardcode in browser dev/preview without
  // worrying about shipping a bypass to prod.
  const forceParam = url.searchParams.get("force") === "1";
  const isNonProd =
    process.env.VERCEL_ENV !== "production" || process.env.NODE_ENV !== "production";
  const skipRateLimit = forceParam && isNonProd;

  const lastEmailed = await getDigestEmailedAt(digest.id);
  if (!skipRateLimit && lastEmailed && Date.now() - lastEmailed.getTime() < ONE_HOUR_MS) {
    return Response.json(
      {
        error: "rate_limited",
        message: "You already emailed this digest in the last hour.",
        retryAfter: Math.ceil((ONE_HOUR_MS - (Date.now() - lastEmailed.getTime())) / 1000),
      },
      { status: 429 },
    );
  }

  // Pull the user's section-visibility prefs so the email matches
  // what they currently see on the dashboard. Falls back to "show
  // everything" when the user has never opened the settings page.
  const settings = await getUserSettings(userId);
  const visibility = settings.digest_sections
    ? (Object.fromEntries(
        Object.entries(settings.digest_sections).map(([k, v]) => [k, !!v]),
      ) as Record<string, boolean>)
    : undefined;

  const props = digestTextToEmailProps({
    text: digest.content,
    repoName: digest.repo,
    stats: digest.stats,
    visibility,
    dateLabel: new Date(digest.created_at).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  const result = await sendDigestEmail({
    to: recipientEmail,
    props,
  });

  if (!result.ok) {
    // dev_disabled is a non-error in local dev — surface it with a 200
    // and a `skipped: true` flag so the UI can show a neutral message
    // ("Email sending is disabled locally") instead of a red error.
    if (result.code === "dev_disabled") {
      return Response.json({ ok: true, skipped: true, reason: result.error });
    }
    const status = result.code === "config" ? 503 : 502;
    console.error("[email/digest] send failed:", result.error);
    return Response.json({ error: result.error }, { status });
  }

  await markDigestEmailed(digest.id);
  return Response.json({ ok: true, id: result.id, to: recipientEmail });
}
