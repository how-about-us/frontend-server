import { create } from "zustand";

/** 채팅 패널 UI 크롬 (열림·최소화·닫힘) */
export type ChatState = "closed" | "minimized" | "maximized";

interface ChatPanelStore {
  chatState: ChatState;
  openChat: () => void;
  minimizeChat: () => void;
  closeChat: () => void;
}

export const useChatPanelStore = create<ChatPanelStore>((set) => ({
  chatState: "closed",
  openChat: () => set({ chatState: "maximized" }),
  minimizeChat: () => set({ chatState: "minimized" }),
  closeChat: () => set({ chatState: "closed" }),
}));
