"use client";

import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import {
  createChatMarkdownComponents,
  type ChatMarkdownVariant,
} from "@/components/chat/chat-markdown-components";
import { prepareUserChatMarkdown } from "@/lib/chat/prepareUserChatMarkdown";
import { cn } from "@/lib/utils";

export function ChatMarkdownContent({
  text,
  variant = "ai",
  className,
  preserveWhitespace = false,
}: {
  text: string;
  variant?: ChatMarkdownVariant;
  className?: string;
  preserveWhitespace?: boolean;
}) {
  if (!text) return null;

  const markdownSource =
    preserveWhitespace ? prepareUserChatMarkdown(text) : text;

  return (
    <div className={cn("break-words", className)}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={createChatMarkdownComponents(variant)}
      >
        {markdownSource}
      </Markdown>
    </div>
  );
}
