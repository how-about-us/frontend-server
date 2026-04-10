"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ChatState = "closed" | "minimized" | "maximized";

type ChatContextType = {
  chatState: ChatState;
  openChat: () => void;
  minimizeChat: () => void;
  closeChat: () => void;
};

const ChatContext = createContext<ChatContextType>({
  chatState: "closed",
  openChat: () => {},
  minimizeChat: () => {},
  closeChat: () => {},
});

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chatState, setChatState] = useState<ChatState>("closed");

  return (
    <ChatContext.Provider
      value={{
        chatState,
        openChat: () => setChatState("maximized"),
        minimizeChat: () => setChatState("minimized"),
        closeChat: () => setChatState("closed"),
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  return useContext(ChatContext);
}
