import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/services/settings";
import { settingsSchema } from "@/lib/validation";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ settings: await getSettings() });
  } catch (err) {
    console.error("[GET /api/settings]", err);
    return jsonError("Não foi possível carregar as configurações.", 500, "db_error");
  }
}

export async function PUT(req: Request) {
  const body = settingsSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return jsonError(body.error.issues[0]?.message ?? "Configurações inválidas.", 400, "invalid_body");
  }
  try {
    return NextResponse.json({ settings: await updateSettings(body.data) });
  } catch (err) {
    console.error("[PUT /api/settings]", err);
    return jsonError("Não foi possível salvar as configurações.", 500, "db_error");
  }
}
