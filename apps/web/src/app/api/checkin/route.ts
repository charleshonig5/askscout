import { auth, getUserId } from "@/auth";
import { recordDailyCheckin } from "@/lib/supabase";

/**
 * POST /api/checkin
 * Body: { repo: "owner/repo", date: "YYYY-MM-DD" }
 *
 * Records a "quiet day" check-in so the user's streak isn't broken on days
 * without commits. The client sends the user's LOCAL date (not UTC) because
 * the streak display is already local-timezone based.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) {
    return Response.json({ error: "Unable to identify user" }, { status: 401 });
  }

  let body: { repo?: string; date?: string };
  try {
    body = (await req.json()) as { repo?: string; date?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const repo = body.repo;
  const date = body.date;
  if (!repo || typeof repo !== "string" || !repo.includes("/")) {
    return Response.json({ error: "Missing or invalid repo" }, { status: 400 });
  }
  // YYYY-MM-DD sanity check — reject anything else so the PK stays clean.
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json(
      { error: "Missing or invalid date (expected YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  try {
    await recordDailyCheckin(userId, repo, date);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("Checkin error:", err);
    return Response.json({ error: "Failed to record check-in" }, { status: 500 });
  }
}
