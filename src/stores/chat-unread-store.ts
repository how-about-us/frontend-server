import { create } from "zustand";
import type { ServerChatMessage } from "@/types/chat";
import { normalizeMessageKind } from "@/lib/chat";

/** 채팅 패널 UI(메인 크롬) — 미읽음 배지와 같은 스토어에서 관리 */
export type ChatState = "closed" | "minimized" | "maximized";

interface ChatUnreadStore {
  chatCnt: number;
  chatState: ChatState;
  resetChatCnt: () => void;
  openChat: () => void;
  minimizeChat: () => void;
  closeChat: () => void;
  incrementFromMessage: (msg: ServerChatMessage) => void;
}

export const useChatUnreadStore = create<ChatUnreadStore>((set, get) => ({
  chatCnt: 0,
  chatState: "closed",
  resetChatCnt: () => set({ chatCnt: 0 }),
  openChat: () =>
    set({
      chatCnt: 0,
      chatState: "maximized",
    }),
  minimizeChat: () => set({ chatState: "minimized" }),
  closeChat: () => set({ chatState: "closed" }),
  incrementFromMessage: (msg) => {
    if (normalizeMessageKind(msg.messageType) === "SYSTEM") return;
    if (get().chatState !== "closed") return;
    set((s) => ({ chatCnt: s.chatCnt + 1 }));
  },
}));
