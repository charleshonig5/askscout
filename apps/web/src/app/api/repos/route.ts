import { auth, getUserId } from "@/auth";
import { fetchUserRepos } from "@/lib/github";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = getUserId(session);
  if (!userId) {
    return Response.json({ error: "Unable to identify user" }, { status: 401 });
  }

  // Rate limit by stable user ID, not token fragment
  const result = checkRateLimit(`repos:${userId}`, RATE_LIMITS.reposPerMinute);
  if (!result.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const repos = await fetchUserRepos(session.accessToken);
    return Response.json({ repos });
  } catch (err) {
    console.error("Repos fetch error:", err);
    return Response.json({ error: "Failed to fetch repos" }, { status: 500 });
  }
}
