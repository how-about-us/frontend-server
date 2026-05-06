"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";
import { groupConsecutiveMessages } from "../lib/chat.utils";
import {
  OtherMessageGroup,
  MyMessageGroup,
  SystemMessage,
  AiMessageGroup,
} from "./ChatMessageGroup";
import { PlaceShareCard } from "./PlaceShareCard";

export function ChatMessageList({
  messages,
  isMinimized = false,
}: {
  messages: ChatMessage[];
  isMinimized?: boolean;
}) {
  const groups = groupConsecutiveMessages(messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto bg-white px-3 py-2 [scrollbar-color:rgba(0,0,0,0.2)_transparent]",
        isMinimized && "px-2 py-1.5",
      )}
    >
      <div className={cn("flex flex-col", isMinimized ? "gap-2" : "gap-3")}>
        {groups.map((group, i) => {
          const type = group[0].type;
          if (type === "system")
            return (
              <SystemMessage
                key={group[0].id}
                message={group[0]}
                isMinimized={isMinimized}
              />
            );
          if (type === "place")
            return (
              <PlaceShareCard
                key={group[0].id}
                message={group[0]}
                isMinimized={isMinimized}
              />
            );
          if (type === "mine")
            return (
              <MyMessageGroup
                key={i}
                messages={group}
                isMinimized={isMinimized}
              />
            );
          if (type === "ai")
            return (
              <AiMessageGroup
                key={i}
                messages={group}
                isMinimized={isMinimized}
              />
            );
          return (
            <OtherMessageGroup
              key={i}
              messages={group}
              isMinimized={isMinimized}
            />
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
