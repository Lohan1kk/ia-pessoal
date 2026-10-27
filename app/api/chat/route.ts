import type { ChatCompletionChunk, ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { Stream } from "openai/streaming";
import { describeOpenAIError, getOpenAI, hasApiKey, MISSING_KEY_MESSAGE } from "@/lib/openai";
import {
  addMessage,
  conversationExists,
  createConversation,
  getRecentMessages,
  titleFromMessage,
} from "@/lib/services/conversations";
import { getSettings } from "@/lib/services/settings";
import { chatRequestSchema } from "@/lib/validation";
import { jsonError } from "@/lib/http";
import { HISTORY_LIMIT } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(req: Request) {
  // 1. Chave configurada?
  if (!hasApiKey()) return jsonError(MISSING_KEY_MESSAGE, 503, "missing_api_key");

  // 2. Valida o corpo (tamanho e formato)
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return jsonError("Requisição grande demais.", 413, "too_large");

  const parsed = chatRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Requisição inválida.", 400, "invalid_body");
  }
  const { conversationId, message } = parsed.data;

  // 3. Confirma que a conversa existe antes de usá-la
  let history: { role: string; content: string }[] = [];
  try {
    if (conversationId) {
      if (!(await conversationExists(conversationId))) {
        return jsonError("Conversa não encontrada.", 404, "not_found");
      }
      history = await getRecentMessages(conversationId, HISTORY_LIMIT);
    }
  } catch (err) {
    console.error("[POST /api/chat] db", err);
    return jsonError("Erro ao acessar o banco de dados.", 500, "db_error");
  }

  // 4. Monta o contexto
  let settings: Awaited<ReturnType<typeof getSettings>>;
  try {
    settings = await getSettings();
  } catch (err) {
    console.error("[POST /api/chat] settings", err);
    return jsonError("Erro ao acessar o banco de dados.", 500, "db_error");
  }

  const payload: ChatCompletionMessageParam[] = [];
  if (settings.systemPrompt) payload.push({ role: "system", content: settings.systemPrompt });
  for (const m of history) {
    if (m.role === "user" || m.role === "assistant") payload.push({ role: m.role, content: m.content });
  }
  payload.push({ role: "user", content: message });

  // 5. Chama a OpenAI. Falhas (chave, cota, rede) acontecem aqui, ANTES de persistir qualquer coisa.
  let openedStream: Stream<ChatCompletionChunk>;
  try {
    openedStream = await getOpenAI().chat.completions.create(
      { model: settings.model, messages: payload, stream: true },
      { signal: req.signal },
    );
  } catch (err) {
    const info = describeOpenAIError(err);
    if (info.code !== "aborted") console.error("[POST /api/chat] openai", err);
    return jsonError(info.message, info.status, info.code);
  }
  const stream = openedStream;

  // 6. Persiste a conversa e a mensagem do usuário
  let createdId: string;
  try {
    createdId = conversationId ?? (await createConversation(titleFromMessage(message))).id;
    await addMessage(createdId, "user", message);
  } catch (err) {
    stream.controller.abort();
    console.error("[POST /api/chat] persist", err);
    return jsonError("Erro ao salvar a mensagem.", 500, "db_error");
  }
  const targetId = createdId;

  // 7. Transmite a resposta e salva o texto (inclusive parcial, se interrompido)
  const encoder = new TextEncoder();
  let full = "";
  let cancelled = false;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (cancelled) break;
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            full += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
        if (!cancelled) controller.close();
      } catch (err) {
        if (cancelled || req.signal.aborted) {
          try { controller.close(); } catch { /* já encerrado */ }
        } else {
          console.error("[POST /api/chat] stream", err);
          try { controller.error(err); } catch { /* já encerrado */ }
        }
      } finally {
        if (full.trim()) {
          await addMessage(targetId, "assistant", full).catch((e) =>
            console.error("[POST /api/chat] save assistant", e),
          );
        }
      }
    },
    cancel() {
      cancelled = true;
      stream.controller.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "X-Conversation-Id": targetId,
    },
  });
}
