import { auth } from "@/auth";
import { getTodaysDigest } from "@/lib/supabase";

/** Check if today's digest already exists for a user+repo+mode */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const repo = url.searchParams.get("repo");
  const mode = url.searchParams.get("mode") ?? "digest";

  if (!repo) {
    return Response.json({ error: "Missing repo param" }, { status: 400 });
  }

  const userId = session.user?.id ?? session.user?.email ?? "unknown";

  try {
    const existing = await getTodaysDigest(userId, repo, mode);
    if (existing) {
      return Response.json({ exists: true, digest: existing });
    }
    return Response.json({ exists: false });
  } catch (err) {
    console.error("Today's digest check error:", err);
    return Response.json({ exists: false });
  }
}
