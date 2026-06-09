import { auth, getUserId } from "@/auth";
import { recordVisit } from "@/lib/supabase";

/* POST /api/visit
 *
 * Fired fire-and-forget from DashboardClient on every mount. Records
 * the visit in user_visits so the admin dashboard can count humans
 * who reached the app, not just humans who successfully generated a
 * digest. Closes the visibility gap created by NextAuth's JWT-only
 * sign-in strategy (which writes nothing to Supabase on its own).
 *
 * No body, no params. Identity is read from the session, never trusted
 * from the client. Returns 204 No Content on success so the client
 * doesn't need to parse anything.
 *
 * Failure modes:
 *   - No session → 401. The dashboard wouldn't render in this case
 *     so it shouldn't fire; this is belt-and-suspenders.
 *   - Supabase down / table missing → 200 with { ok: false }. The
 *     visit just doesn't get recorded that round. Dashboard is
 *     unaffected; the user still sees their digest. */
export async function POST(): Promise<Response> {
  const session = await auth();
  if (!session?.user) {
    return new Response(null, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return new Response(null, { status: 401 });
  }
  await recordVisit(userId);
  return new Response(null, { status: 204 });
}
