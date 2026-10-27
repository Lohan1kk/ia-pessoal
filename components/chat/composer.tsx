"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_MESSAGE_LENGTH } from "@/lib/constants";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  streaming: boolean;
  resetKey: string | null;
}

export function Composer({ value, onChange, onSend, onStop, streaming, resetKey }: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Ajusta a altura conforme o conteúdo
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  // Foca o campo em telas grandes (evita abrir o teclado no celular)
  useEffect(() => {
    if (!streaming && window.matchMedia("(min-width: 768px)").matches) {
      ref.current?.focus();
    }
  }, [streaming, resetKey]);

  const canSend = value.trim().length > 0 && !streaming;
  const nearLimit = value.length > MAX_MESSAGE_LENGTH * 0.9;

  return (
    <div>
      <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 transition-colors focus-within:border-ring/60">
        <textarea
          ref={ref}
          value={value}
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          placeholder="Escreva sua mensagem…"
          aria-label="Mensagem para a Lohan AI"
          className="max-h-[200px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 placeholder:text-muted-foreground focus:outline-none"
        />
        {streaming ? (
          <Button size="icon" variant="secondary" onClick={onStop} aria-label="Interromper geração" title="Interromper geração" className="h-10 w-10 shrink-0 rounded-xl">
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button size="icon" onClick={onSend} disabled={!canSend} aria-label="Enviar mensagem" title="Enviar (Enter)" className="h-10 w-10 shrink-0 rounded-xl">
            <ArrowUp className="h-5 w-5" />
          </Button>
        )}
      </div>
      <p className="mt-2 px-1 text-center text-xs text-muted-foreground">
        {nearLimit
          ? `${value.length}/${MAX_MESSAGE_LENGTH} caracteres`
          : "Enter envia, Shift + Enter quebra a linha. A Lohan AI pode cometer erros; confira informações importantes."}
      </p>
    </div>
  );
}
