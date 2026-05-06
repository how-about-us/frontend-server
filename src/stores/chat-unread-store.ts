import { create } from "zustand";
import type { ServerChatMessage } from "@/types/chat";
import { normalizeMessageKind } from "@/lib/chat/messageKind";

interface ChatUnreadStore {
  chatCnt: number;
  isPanelOpen: boolean;
  resetChatCnt: () => void;
  setPanelOpen: (open: boolean) => void;
  incrementFromMessage: (msg: ServerChatMessage) => void;
}

export const useChatUnreadStore = create<ChatUnreadStore>((set, get) => ({
  chatCnt: 0,
  isPanelOpen: false,
  resetChatCnt: () => set({ chatCnt: 0 }),
  setPanelOpen: (open) => set({ isPanelOpen: open }),
  incrementFromMessage: (msg) => {
    if (normalizeMessageKind(msg.messageType) === "SYSTEM") return;
    if (get().isPanelOpen) return;
    set((s) => ({ chatCnt: s.chatCnt + 1 }));
  },
}));
