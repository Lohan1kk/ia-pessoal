import { NextResponse } from "next/server";
import { listConversations } from "@/lib/services/conversations";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const conversations = await listConversations();
    return NextResponse.json({ conversations });
  } catch (err) {
    console.error("[GET /api/conversations]", err);
    return jsonError("Não foi possível carregar as conversas. O banco de dados foi criado? Rode: npm run db:migrate", 500, "db_error");
  }
}
