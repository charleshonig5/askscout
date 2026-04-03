import { auth } from "@/auth";
import { getDigestHistory } from "@/lib/supabase";

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

  const userId = session.user?.id ?? session.user?.email ?? "unknown";

  try {
    const history = await getDigestHistory(userId, repo);
    return Response.json({ history });
  } catch (err) {
    console.error("History fetch error:", err);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
