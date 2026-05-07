"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/chat";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { groupConsecutiveMessages } from "../lib/chat.utils";
import { getChatMessageMotion } from "../lib/chat.animations";
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
  onCancelAiRequest,
}: {
  messages: ChatMessage[];
  isMinimized?: boolean;
  onCancelAiRequest?: (requestMessageId: string) => void;
}) {
  const groups = groupConsecutiveMessages(messages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const myId = useSessionStore((s) => s.user?.id);
  const reduceMotion = useReducedMotion();

  const scrollToMessage = useCallback((messageId: string) => {
    const root = scrollRootRef.current;
    if (!root) return;
    const el = root.querySelector(
      `[data-chat-anchor="${CSS.escape(messageId)}"]`,
    );
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      ref={scrollRootRef}
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-y-auto bg-brand-green/8 px-3 py-2 [scrollbar-color:rgba(255,255,255,0.35)_transparent]",
        isMinimized && "px-2 py-1.5",
      )}
    >
      <div className={cn("flex flex-col", isMinimized ? "gap-2" : "gap-3")}>
        {groups.map((group) => {
          const type = group[0].type;
          const placeIsMine =
            type === "place" &&
            myId != null &&
            group[0].senderUserId != null &&
            group[0].senderUserId === myId;
          const motionCfg = getChatMessageMotion(type, { placeIsMine });

          const inner =
            type === "system" ? (
              <SystemMessage
                message={group[0]}
                isMinimized={isMinimized}
              />
            ) :
            type === "place" ? (
              <PlaceShareCard
                message={group[0]}
                isMinimized={isMinimized}
              />
            ) :
            type === "mine" ? (
              <MyMessageGroup
                messages={group}
                isMinimized={isMinimized}
                onCancelAiRequest={onCancelAiRequest}
              />
            ) :
            type === "ai" ? (
              <AiMessageGroup
                messages={group}
                isMinimized={isMinimized}
                onReplyTargetClick={scrollToMessage}
              />
            ) : (
              <OtherMessageGroup
                messages={group}
                isMinimized={isMinimized}
              />
            );

          return (
            <motion.div
              key={group[0].id}
              initial={reduceMotion ? false : motionCfg.initial}
              animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              transition={
                reduceMotion ? { duration: 0 } : motionCfg.transition
              }
            >
              {inner}
            </motion.div>
          );
        })}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
