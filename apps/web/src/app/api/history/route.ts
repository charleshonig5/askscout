import { auth, getUserId } from "@/auth";
import { getCheckinDates, getDigestHistory } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const repo = url.searchParams.get("repo");
  if (!repo) {
    return Response.json({ error: "Missing repo param" }, { status: 400 });
  }

  const userId = getUserId(session);
  if (!userId) {
    return Response.json({ error: "Unable to identify user" }, { status: 401 });
  }

  try {
    // Fetch history + check-in dates in parallel so the streak can count both.
    const [history, checkinDates] = await Promise.all([
      getDigestHistory(userId, repo),
      getCheckinDates(userId, repo),
    ]);
    return Response.json({ history, checkinDates });
  } catch (err) {
    console.error("History fetch error:", err);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
