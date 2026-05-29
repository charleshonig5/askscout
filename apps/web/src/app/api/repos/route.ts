import { auth, getUserId } from "@/auth";
import { fetchUserRepos } from "@/lib/github";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getActiveRepos } from "@/lib/supabase";

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
    // Fetch GitHub repos + Scout-active repos in parallel. `activeRepos` is
    // used by the repo selector to float repos-with-activity to the top.
    const [repos, activeRepos] = await Promise.all([
      fetchUserRepos(session.accessToken),
      getActiveRepos(userId),
    ]);
    return Response.json({ repos, activeRepos });
  } catch (err) {
    console.error("Repos fetch error:", err);
    return Response.json({ error: "Failed to fetch repos" }, { status: 500 });
  }
}
