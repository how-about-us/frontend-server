import { create } from "zustand";
import type { ServerChatMessage } from "@/types/chat";

function normalizeMessageKind(raw: unknown): string {
  if (raw == null) return "CHAT";
  if (typeof raw !== "string") return "CHAT";
  const t = raw.trim();
  if (!t) return "CHAT";
  return t.toUpperCase();
}

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
