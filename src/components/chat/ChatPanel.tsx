"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/contexts/ChatContext";
import { MOCK_CHAT_MESSAGES } from "@/mocks";
import { ChatPanelHeader } from "./ChatPanelHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInputBar } from "./ChatInputBar";
import {
  panelVariants,
  panelTransition,
  getPanelAnimate,
} from "./chat.animations";

export function ChatPanel() {
  const { chatState, openChat, minimizeChat, closeChat } = useChat();
  const isMinimized = chatState === "minimized";

  return (
    <AnimatePresence>
      {chatState !== "closed" && (
        <motion.div
          key="chat-panel"
          layout
          variants={panelVariants}
          initial="hidden"
          animate={getPanelAnimate(isMinimized)}
          exit="exit"
          transition={panelTransition}
          className={
            isMinimized
              ? "absolute bottom-6 right-6 z-20 flex h-[460px] w-72 flex-col overflow-hidden border border-gray-border bg-white"
              : "absolute top-0 left-0 w-[400px] z-10 flex flex-col overflow-hidden bg-white"
          }
        >
          <ChatPanelHeader
            isMinimized={isMinimized}
            onMaximize={openChat}
            onMinimize={minimizeChat}
            onClose={closeChat}
          />
          <div className="h-px bg-black/[0.08]" />
          <ChatMessageList messages={MOCK_CHAT_MESSAGES} />
          <ChatInputBar isMinimized={isMinimized} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
