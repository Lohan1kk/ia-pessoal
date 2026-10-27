"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api-client";
import {
  DEFAULT_SYSTEM_PROMPT,
  MAX_SYSTEM_PROMPT_LENGTH,
  MODELS,
  PERSONALITY_PRESETS,
} from "@/lib/constants";
import type { AppSettings } from "@/lib/types";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (settings: AppSettings) => void;
}

export function SettingsDialog({ open, onOpenChange, onSaved }: SettingsDialogProps) {
  const [model, setModel] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError(null);
    api
      .getSettings()
      .then((s) => {
        if (!active) return;
        setModel(s.model);
        setPrompt(s.systemPrompt);
      })
      .catch((e) => {
        if (active) setError(e instanceof ApiError ? e.message : "Não foi possível carregar as configurações.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const saved = await api.saveSettings({ model, systemPrompt: prompt });
      onSaved(saved);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível salvar as configurações.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Escolha o modelo e defina a personalidade da Lohan AI. Vale para as próximas mensagens.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10" role="status" aria-label="Carregando">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-5">
            <div className="grid gap-2">
              <label htmlFor="model" className="text-sm font-medium">Modelo</label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.hint}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label htmlFor="system-prompt" className="text-sm font-medium">Personalidade (instruções de sistema)</label>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Modelos de personalidade">
                {PERSONALITY_PRESETS.map((p) => (
                  <Button key={p.label} variant="outline" size="sm" onClick={() => setPrompt(p.prompt)}>
                    {p.label}
                  </Button>
                ))}
              </div>
              <Textarea
                id="system-prompt"
                value={prompt}
                maxLength={MAX_SYSTEM_PROMPT_LENGTH}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[160px]"
                placeholder="Descreva como a Lohan AI deve se comportar."
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <button
                  type="button"
                  className="underline underline-offset-2 hover:text-foreground"
                  onClick={() => setPrompt(DEFAULT_SYSTEM_PROMPT)}
                >
                  Restaurar padrão
                </button>
                <span>{prompt.length}/{MAX_SYSTEM_PROMPT_LENGTH}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || saving || !model}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
