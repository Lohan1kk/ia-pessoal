"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, Menu, X } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Composer } from "@/components/chat/composer";
import { MessageList } from "@/components/chat/message-list";
import { SettingsDialog } from "@/components/chat/settings-dialog";
import { Welcome } from "@/components/chat/welcome";
import { api, ApiError } from "@/lib/api-client";
import { MAX_MESSAGE_LENGTH, MODELS } from "@/lib/constants";
import type { AppSettings, ChatMessage, ConversationSummary } from "@/lib/types";

const ACTIVE_KEY = "lohan:active-conversation";
const COLLAPSED_KEY = "lohan:sidebar-collapsed";

function remember(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // armazenamento indisponível: apenas ignora (preferência de interface)
  }
}

function errorMessage(e: unknown): string {
  return e instanceof ApiError ? e.message : "Ocorreu um erro inesperado.";
}

export function ChatApp() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  const refreshConversations = useCallback(async () => {
    try {
      setConversations(await api.listConversations());
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  const openConversation = useCallback(async (id: string) => {
    abortRef.current?.abort();
    setError(null);
    setLoadingConversation(true);
    setActiveId(id);
    setMobileOpen(false);
    stickRef.current = true;
    try {
      const data = await api.getConversation(id);
      setMessages(data.messages);
      remember(ACTIVE_KEY, id);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setActiveId(null);
        setMessages([]);
        remember(ACTIVE_KEY, null);
      } else {
        setError(errorMessage(e));
      }
    } finally {
      setLoadingConversation(false);
    }
  }, []);

  const resetToNew = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
    setMessages([]);
    setDraft("");
    setError(null);
    setMobileOpen(false);
    remember(ACTIVE_KEY, null);
  }, []);

  // Carga inicial
  useEffect(() => {
    let saved: string | null = null;
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
      saved = localStorage.getItem(ACTIVE_KEY);
    } catch {
      // ignora
    }
    void refreshConversations();
    api.getSettings().then(setSettings).catch(() => undefined);
    if (saved) void openConversation(saved);
  }, [refreshConversations, openConversation]);

  // Mantém a rolagem no fim enquanto a resposta chega
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? draft).trim();
      if (!text || streaming) return;
      if (text.length > MAX_MESSAGE_LENGTH) {
        setError(`A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`);
        return;
      }

      setError(null);
      if (raw === undefined) setDraft(""); // sugestões não apagam o rascunho do usuário
      stickRef.current = true;

      const stamp = Date.now();
      const userMsg: ChatMessage = { id: `tmp-u-${stamp}`, role: "user", content: text };
      const botMsg: ChatMessage = { id: `tmp-a-${stamp}`, role: "assistant", content: "" };
      setMessages((prev) => [...prev, userMsg, botMsg]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      let received = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: activeId ?? undefined, message: text }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
          throw new ApiError(data?.error ?? `Erro inesperado (${res.status}).`, data?.code, res.status);
        }

        const newId = res.headers.get("X-Conversation-Id");
        if (newId && newId !== activeId) {
          setActiveId(newId);
          remember(ACTIVE_KEY, newId);
        }
        if (!res.body) throw new ApiError("Resposta vazia do servidor.", "empty");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          received += decoder.decode(value, { stream: true });
          if (controller.signal.aborted) break;
          const snapshot = received;
          setMessages((prev) => prev.map((m) => (m.id === botMsg.id ? { ...m, content: snapshot } : m)));
        }
        received += decoder.decode();
        const finalText = received;
        setMessages((prev) => prev.map((m) => (m.id === botMsg.id ? { ...m, content: finalText } : m)));
      } catch (e) {
        if (controller.signal.aborted) {
          // Interrompido pelo usuário: mantém o texto parcial; remove o balão vazio, se houver
          if (!received) setMessages((prev) => prev.filter((m) => m.id !== botMsg.id));
        } else if (e instanceof ApiError && e.code === "not_found") {
          // A conversa foi excluída em outra aba/sessão: volta para uma conversa nova
          setMessages([]);
          resetToNew();
          setDraft(text);
          setError("Esta conversa não existe mais. Envie a mensagem novamente para iniciar outra.");
        } else {
          const message =
            e instanceof ApiError
              ? e.message
              : e instanceof TypeError
                ? "A conexão com o servidor foi interrompida."
                : "Ocorreu um erro inesperado.";
          setError(message);
          if (!received) {
            // Nada foi gerado: desfaz a mensagem otimista e devolve o texto ao campo
            setMessages((prev) => prev.filter((m) => m.id !== userMsg.id && m.id !== botMsg.id));
            setDraft(text);
          }
        }
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setStreaming(false);
        }
        void refreshConversations();
      }
    },
    [draft, streaming, activeId, refreshConversations, resetToNew],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const handleRename = useCallback(async (id: string, title: string) => {
    try {
      const updated = await api.renameConversation(id, title);
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c)));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === activeId) resetToNew();
    },
    [activeId, resetToNew],
  );

  function toggleCollapsed() {
    setCollapsed((prev) => {
      remember(COLLAPSED_KEY, prev ? "0" : "1");
      return !prev;
    });
  }

  const activeTitle = conversations.find((c) => c.id === activeId)?.title ?? "Nova conversa";
  const modelLabel = MODELS.find((m) => m.id === settings?.model)?.label ?? settings?.model;
  const isEmpty = messages.length === 0 && !loadingConversation;

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
        onNewChat={resetToNew}
        onSelect={openConversation}
        onRename={handleRename}
        onDelete={handleDelete}
        onOpenSettings={() => {
          setMobileOpen(false);
          setSettingsOpen(true);
        }}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="truncate text-sm font-medium">{activeTitle}</h1>
          {modelLabel && (
            <span className="ml-auto shrink-0 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
              {modelLabel}
            </span>
          )}
        </header>

        <div ref={scrollRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
          {loadingConversation ? (
            <div className="flex h-full items-center justify-center" role="status" aria-label="Carregando conversa">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : isEmpty ? (
            <Welcome onPick={(p) => void send(p)} disabled={streaming} />
          ) : (
            <MessageList messages={messages} streaming={streaming} />
          )}
        </div>

        <div className="shrink-0 px-4 pb-3 pt-2">
          <div className="mx-auto w-full max-w-3xl">
            {error && (
              <div
                role="alert"
                className="mb-2 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="flex-1 text-foreground">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="Dispensar erro"
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <Composer
              value={draft}
              onChange={setDraft}
              onSend={() => void send()}
              onStop={stop}
              streaming={streaming}
              resetKey={activeId}
            />
          </div>
        </div>
      </main>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} onSaved={setSettings} />
    </div>
  );
}
