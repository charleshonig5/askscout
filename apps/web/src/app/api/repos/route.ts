import { auth } from "@/auth";
import { fetchUserRepos } from "@/lib/github";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repos = await fetchUserRepos(session.accessToken);
    return Response.json({ repos });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch repos";
    return Response.json({ error: message }, { status: 500 });
  }
}
