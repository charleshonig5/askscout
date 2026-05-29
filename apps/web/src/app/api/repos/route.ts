import { auth, getUserId } from "@/auth";
import { fetchUserRepos } from "@/lib/github";
import { getGithubToken } from "@/lib/github-token";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { getActiveRepos } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The GitHub access_token is read from the JWT (server-side only) rather
  // than the session, so it never reaches the browser. See lib/github-token.
  const accessToken = await getGithubToken(req);
  if (!accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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
      fetchUserRepos(accessToken),
      getActiveRepos(userId),
    ]);
    return Response.json({ repos, activeRepos });
  } catch (err) {
    console.error("Repos fetch error:", err);
    return Response.json({ error: "Failed to fetch repos" }, { status: 500 });
  }
}
