"use client";

import { useShallow } from "zustand/react/shallow";

import type { ChatState } from "@/stores/chat-unread-store";
import { useChatUnreadStore } from "@/stores/chat-unread-store";

export type { ChatState };

export function useChat() {
  return useChatUnreadStore(
    useShallow((s) => ({
      chatState: s.chatState,
      openChat: s.openChat,
      minimizeChat: s.minimizeChat,
      closeChat: s.closeChat,
    })),
  );
}
