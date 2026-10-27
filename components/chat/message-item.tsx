import { memo } from "react";
import { CopyButton } from "@/components/copy-button";
import { LogoMark } from "@/components/logo";
import { Markdown } from "@/components/chat/markdown";
import type { ChatMessage } from "@/lib/types";

function TypingDots() {
  return (
    <div className="flex h-7 items-center gap-1" role="status" aria-label="Lohan AI está respondendo">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </div>
  );
}

export const MessageItem = memo(function MessageItem({
  message,
  isStreaming,
}: {
  message: ChatMessage;
  isStreaming: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-muted px-4 py-2.5 text-[15px] leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex gap-3">
      <LogoMark size={28} className="mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        {message.content ? <Markdown content={message.content} /> : <TypingDots />}
        {message.content && !isStreaming && (
          <div className="mt-1 -ml-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <CopyButton text={message.content} label="Copiar resposta" showLabel />
          </div>
        )}
      </div>
    </div>
  );
});
