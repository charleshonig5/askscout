import { auth, getUserId } from "@/auth";
import { deleteAllDigests, deleteRepoDigests, deleteUserAccount } from "@/lib/supabase";

/** Delete history or account */
export async function DELETE(req: Request) {
  // CSRF defense-in-depth: reject any cross-origin request even
  // before checking the session. SameSite=Lax already blocks
  // cross-site DELETEs with credentials in current browsers, but
  // this guard means we don't rely on default cookie policy if it
  // ever changes (e.g. embedding work that flips SameSite=None).
  // The DELETE here is irreversible — it wipes every digest, every
  // project summary, and the user record — so belt-and-suspenders.
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

  const action = url.searchParams.get("action");
  const repo = url.searchParams.get("repo");

  if (action === "delete-repo-history" && repo) {
    const result = await deleteRepoDigests(userId, repo);
    if (!result.ok) {
      // Surface the failure instead of returning a fake-success
      // 200. Status 500 trips the `!res.ok` branch in the Settings
      // page's existing error handler ("Couldn't clear ${repo} —
      // the history is still intact"), which is the honest message
      // when the delete actually didn't go through.
      return Response.json(
        { error: result.error ?? "Failed to clear repo history" },
        { status: 500 },
      );
    }
    return Response.json({ ok: true, message: "Repo history deleted" });
  }

  if (action === "delete-all-history") {
    const result = await deleteAllDigests(userId);
    if (!result.ok) {
      return Response.json({ error: result.error ?? "Failed to clear history" }, { status: 500 });
    }
    return Response.json({ ok: true, message: "All history deleted" });
  }

  if (action === "delete-account") {
    await deleteUserAccount(userId);
    return Response.json({ ok: true, message: "Account deleted" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
