import { auth } from "@/auth";
import { getUserSettings, saveUserSettings } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user?.id ?? session.user?.email ?? "unknown";
  const settings = await getUserSettings(userId);
  return Response.json(settings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user?.id ?? session.user?.email ?? "unknown";
  const body = (await req.json()) as { default_repo?: string };
  await saveUserSettings(userId, { default_repo: body.default_repo ?? null });
  return Response.json({ ok: true });
}
