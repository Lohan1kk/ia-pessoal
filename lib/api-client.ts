import type { AppSettings, ChatMessage, ConversationSummary } from "@/lib/types";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "unknown", status = 0) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Verifique sua conexão.", "network");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
    throw new ApiError(data?.error ?? `Erro inesperado (${res.status}).`, data?.code ?? "unknown", res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  async listConversations(): Promise<ConversationSummary[]> {
    const data = await request<{ conversations: ConversationSummary[] }>("/api/conversations");
    return data.conversations;
  },
  getConversation(id: string) {
    return request<{ conversation: ConversationSummary; messages: ChatMessage[] }>(`/api/conversations/${id}`);
  },
  async renameConversation(id: string, title: string): Promise<ConversationSummary> {
    const data = await request<{ conversation: ConversationSummary }>(`/api/conversations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ title }),
    });
    return data.conversation;
  },
  async deleteConversation(id: string): Promise<void> {
    await request<void>(`/api/conversations/${id}`, { method: "DELETE" });
  },
  async getSettings(): Promise<AppSettings> {
    const data = await request<{ settings: AppSettings }>("/api/settings");
    return data.settings;
  },
  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    const data = await request<{ settings: AppSettings }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    return data.settings;
  },
};
