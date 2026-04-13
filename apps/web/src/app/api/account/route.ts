import { auth, getUserId } from "@/auth";
import { deleteAllDigests, deleteRepoDigests, deleteUserAccount } from "@/lib/supabase";

/** Delete history or account */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return Response.json({ error: "Unable to identify user" }, { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const repo = url.searchParams.get("repo");

  if (action === "delete-repo-history" && repo) {
    await deleteRepoDigests(userId, repo);
    return Response.json({ ok: true, message: "Repo history deleted" });
  }

  if (action === "delete-all-history") {
    await deleteAllDigests(userId);
    return Response.json({ ok: true, message: "All history deleted" });
  }

  if (action === "delete-account") {
    await deleteUserAccount(userId);
    return Response.json({ ok: true, message: "Account deleted" });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
