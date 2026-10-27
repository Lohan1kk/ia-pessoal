import { MessageItem } from "@/components/chat/message-item";
import type { ChatMessage } from "@/lib/types";

export function MessageList({ messages, streaming }: { messages: ChatMessage[]; streaming: boolean }) {
  const lastIndex = messages.length - 1;
  return (
    <div className="mx-auto w-full max-w-3xl space-y-7 px-4 py-6">
      {messages.map((m, i) => (
        <MessageItem key={m.id} message={m} isStreaming={streaming && i === lastIndex} />
      ))}
    </div>
  );
}
