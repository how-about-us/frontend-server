import { create } from "zustand";

/** 채팅 패널 UI(메인 크롬) */
export type ChatState = "closed" | "minimized" | "maximized";

interface ChatUnreadStore {
  chatState: ChatState;
  openChat: () => void;
  minimizeChat: () => void;
  closeChat: () => void;
}

export const useChatUnreadStore = create<ChatUnreadStore>((set) => ({
  chatState: "closed",
  openChat: () => set({ chatState: "maximized" }),
  minimizeChat: () => set({ chatState: "minimized" }),
  closeChat: () => set({ chatState: "closed" }),
}));
