"use client";

import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyButton } from "@/components/copy-button";

function CodeBlock({ language, code }: { language?: string; code: string }) {
  return (
    <div className="my-3 overflow-hidden rounded-xl border bg-[hsl(var(--code))]">
      <div className="flex items-center justify-between border-b px-3 py-1.5">
        <span className="font-mono text-xs text-muted-foreground">{language ?? "código"}</span>
        <CopyButton text={code} label="Copiar código" showLabel />
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

const components: Components = {
  pre({ children }) {
    return <>{children}</>;
  },
  code({ className, children }) {
    const text = String(children ?? "");
    const match = /language-([\w+-]+)/.exec(className ?? "");
    if (!match && !text.includes("\n")) {
      return <code className="inline-code">{children}</code>;
    }
    return <CodeBlock language={match?.[1]} code={text.replace(/\n$/, "")} />;
  },
  table({ children }) {
    return (
      <div className="table-wrap">
        <table>{children}</table>
      </div>
    );
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  },
};

export const Markdown = memo(function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
