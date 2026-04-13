import { auth, getUserId } from "@/auth";
import { getUserSettings, saveUserSettings } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return Response.json({ error: "Unable to identify user" }, { status: 401 });
  }
  const settings = await getUserSettings(userId);
  return Response.json(settings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = getUserId(session);
  if (!userId) {
    return Response.json({ error: "Unable to identify user" }, { status: 401 });
  }
  const body = (await req.json()) as {
    default_repo?: string;
    digest_sections?: Record<string, boolean>;
  };
  const updates: Record<string, unknown> = {};
  if ("default_repo" in body) updates.default_repo = body.default_repo ?? null;
  if ("digest_sections" in body) updates.digest_sections = body.digest_sections ?? null;
  await saveUserSettings(userId, updates);
  return Response.json({ ok: true });
}
