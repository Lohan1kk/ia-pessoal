"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/logo";
import { SUGGESTIONS } from "@/lib/constants";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function Welcome({ onPick, disabled }: { onPick: (prompt: string) => void; disabled: boolean }) {
  const [hello, setHello] = useState("Olá");
  useEffect(() => setHello(greeting()), []);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-10">
      <LogoMark size={48} />
      <h2 className="mt-5 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
        {hello}. Como posso ajudar?
      </h2>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Escolha uma sugestão ou escreva sua própria mensagem abaixo.
      </p>
      <div className="mt-8 grid w-full gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s.prompt)}
            className="rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <span className="block text-sm font-medium">{s.title}</span>
            <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{s.prompt}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
