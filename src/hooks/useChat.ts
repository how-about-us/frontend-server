"use client";

import { useShallow } from "zustand/react/shallow";

import type { ChatState } from "@/stores/chat-panel-store";
import { useChatPanelStore } from "@/stores/chat-panel-store";

export type { ChatState };

export function useChat() {
  return useChatPanelStore(
    useShallow((s) => ({
      chatState: s.chatState,
      openChat: s.openChat,
      minimizeChat: s.minimizeChat,
      closeChat: s.closeChat,
    })),
  );
}
