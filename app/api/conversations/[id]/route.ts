import { NextResponse } from "next/server";
import {
  deleteConversation,
  getConversationWithMessages,
  renameConversation,
} from "@/lib/services/conversations";
import { idSchema, renameSchema } from "@/lib/validation";
import { jsonError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function parseId(ctx: Ctx) {
  const { id } = await ctx.params;
  const parsed = idSchema.safeParse(id);
  return parsed.success ? parsed.data : null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const id = await parseId(ctx);
  if (!id) return jsonError("Identificador de conversa inválido.", 400, "invalid_id");
  try {
    const conversation = await getConversationWithMessages(id);
    if (!conversation) return jsonError("Conversa não encontrada.", 404, "not_found");
    const { messages, ...summary } = conversation;
    return NextResponse.json({ conversation: summary, messages });
  } catch (err) {
    console.error("[GET /api/conversations/:id]", err);
    return jsonError("Não foi possível carregar a conversa.", 500, "db_error");
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const id = await parseId(ctx);
  if (!id) return jsonError("Identificador de conversa inválido.", 400, "invalid_id");

  const body = renameSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return jsonError(body.error.issues[0]?.message ?? "Dados inválidos.", 400, "invalid_body");
  }
  try {
    const conversation = await renameConversation(id, body.data.title);
    if (!conversation) return jsonError("Conversa não encontrada.", 404, "not_found");
    return NextResponse.json({ conversation });
  } catch (err) {
    console.error("[PATCH /api/conversations/:id]", err);
    return jsonError("Não foi possível renomear a conversa.", 500, "db_error");
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const id = await parseId(ctx);
  if (!id) return jsonError("Identificador de conversa inválido.", 400, "invalid_id");
  try {
    const deleted = await deleteConversation(id);
    if (!deleted) return jsonError("Conversa não encontrada.", 404, "not_found");
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/conversations/:id]", err);
    return jsonError("Não foi possível excluir a conversa.", 500, "db_error");
  }
}
