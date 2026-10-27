"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, PanelLeftClose, Pencil, Plus, Settings, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "@/lib/types";

interface SidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onOpenSettings: () => void;
}

export function Sidebar({
  conversations,
  activeId,
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
  onNewChat,
  onSelect,
  onRename,
  onDelete,
  onOpenSettings,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const cancelRef = useRef(false);
  const [pendingDelete, setPendingDelete] = useState<ConversationSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Esc fecha a gaveta no celular
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseMobile();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen, onCloseMobile]);

  // Itens de texto somem quando a barra está recolhida (apenas em telas md+)
  const hideWhenCollapsed = collapsed ? "md:hidden" : "";

  function startRename(c: ConversationSummary) {
    cancelRef.current = false;
    setEditingId(c.id);
    setEditValue(c.title);
  }

  async function commitRename() {
    const id = editingId;
    const cancelled = cancelRef.current;
    cancelRef.current = false;
    setEditingId(null);
    if (!id || cancelled) return;
    const title = editValue.trim();
    const current = conversations.find((c) => c.id === id);
    if (!title || title === current?.title) return;
    await onRename(id, title);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete(pendingDelete.id);
      setPendingDelete(null);
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Não foi possível excluir a conversa.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside
        aria-label="Barra lateral"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 max-w-[85vw] flex-col border-r bg-sidebar transition-[transform,width,visibility] duration-200 md:visible md:static md:max-w-none md:translate-x-0",
          // fechada no celular: fora da tela e fora da ordem de tabulação
          mobileOpen ? "visible translate-x-0" : "invisible -translate-x-full",
          collapsed ? "md:w-[68px]" : "md:w-72",
        )}
      >
        {/* Cabeçalho */}
        <div className={cn("flex h-14 items-center justify-between px-3", collapsed && "md:justify-center")}>
          {collapsed ? (
            <>
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Expandir barra lateral"
                title="Expandir barra lateral"
                className="hidden rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:block"
              >
                <LogoMark size={28} />
              </button>
              <div className="flex items-center gap-2 md:hidden">
                <LogoMark size={28} />
                <span className="font-semibold tracking-tight">Lohan AI</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <LogoMark size={28} />
              <span className="font-semibold tracking-tight">Lohan AI</span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className={cn("hidden md:inline-flex", collapsed && "md:hidden")}
            onClick={onToggleCollapse}
            aria-label="Recolher barra lateral"
            title="Recolher barra lateral"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onCloseMobile} aria-label="Fechar menu">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Nova conversa */}
        <div className="px-3 pb-2">
          <Button
            variant="outline"
            className={cn("w-full justify-start gap-2", collapsed && "md:w-10 md:justify-center md:px-0")}
            onClick={onNewChat}
            aria-label="Nova conversa"
            title="Nova conversa"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className={hideWhenCollapsed}>Nova conversa</span>
          </Button>
        </div>

        {/* Lista */}
        <nav aria-label="Conversas" className={cn("min-h-0 flex-1 overflow-y-auto px-2 py-1", hideWhenCollapsed)}>
          {conversations.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Suas conversas aparecerão aqui.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {conversations.map((c) => {
                const active = c.id === activeId;
                return (
                  <li key={c.id} className="group relative">
                    {editingId === c.id ? (
                      <Input
                        autoFocus
                        value={editValue}
                        maxLength={120}
                        aria-label="Novo título da conversa"
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                          if (e.key === "Escape") {
                            cancelRef.current = true;
                            e.currentTarget.blur();
                          }
                        }}
                        className="h-9"
                      />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelect(c.id)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex h-9 w-full items-center gap-2 rounded-lg px-3 pr-16 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active && "bg-accent font-medium",
                          )}
                        >
                          <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{c.title}</span>
                        </button>
                        <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                          <button
                            type="button"
                            onClick={() => startRename(c)}
                            aria-label={`Renomear conversa ${c.title}`}
                            title="Renomear"
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setPendingDelete(c);
                            }}
                            aria-label={`Excluir conversa ${c.title}`}
                            title="Excluir"
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
        {collapsed && <div className="hidden flex-1 md:block" />}

        {/* Rodapé */}
        <div className={cn("space-y-0.5 border-t p-2", collapsed && "md:flex md:flex-col md:items-center")}>
          <Button
            variant="ghost"
            className={cn("w-full justify-start gap-3", collapsed && "md:w-10 md:justify-center md:px-0")}
            onClick={onOpenSettings}
            aria-label="Configurações"
            title="Configurações"
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span className={hideWhenCollapsed}>Configurações</span>
          </Button>
          <div className={cn(collapsed && "md:w-10")}>
            <ThemeToggle withLabel className={cn("w-full", collapsed && "md:justify-center md:px-0 [&>span]:md:hidden")} />
          </div>
        </div>
      </aside>

      {/* Confirmação de exclusão */}
      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir conversa?</DialogTitle>
            <DialogDescription>
              A conversa <strong className="text-foreground">{pendingDelete?.title}</strong> e todas as suas
              mensagens serão apagadas. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">{deleteError}</p>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Excluir conversa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
