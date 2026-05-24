"use client";

import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import {
  createChatMarkdownComponents,
  type ChatMarkdownVariant,
} from "@/components/chat/chat-markdown-components";
import { cn } from "@/lib/utils";

export function ChatMarkdownContent({
  text,
  variant = "ai",
  className,
}: {
  text: string;
  variant?: ChatMarkdownVariant;
  className?: string;
}) {
  if (!text) return null;

  return (
    <div className={cn("break-words", className)}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={createChatMarkdownComponents(variant)}
      >
        {text}
      </Markdown>
    </div>
  );
}
