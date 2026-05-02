"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useChat } from "@/contexts/ChatContext";
import { roomIdFromPlanPath } from "@/lib/main-room";
import { useSessionStore } from "@/stores/session-store";
import { useChatMessages } from "@/hooks/useChatMessages";
import { ChatPanelHeader } from "./ChatPanelHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInputBar } from "./ChatInputBar";
import {
  panelVariants,
  panelTransition,
  getPanelAnimate,
} from "./chat.animations";

/** 스토어의 currentRoomId가 없을 때 `/plan/{roomId}` 경로에서 roomId 보강 (persist 비대상 대응) */
function useChatRoomId(): string | null {
  const pathname = usePathname();
  const storeRoomId = useSessionStore((s) => s.currentRoomId);
  const pathRoomId = roomIdFromPlanPath(pathname);
  return storeRoomId ?? pathRoomId;
}

export function ChatPanel() {
  const { chatState, openChat, minimizeChat, closeChat } = useChat();
  const isMinimized = chatState === "minimized";
  const roomId = useChatRoomId();
  const { messages, sendMessage } = useChatMessages(roomId);

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
              : "absolute top-0 left-0 bottom-0 w-[400px] z-10 flex flex-col overflow-hidden bg-white"
          }
        >
          <ChatPanelHeader
            isMinimized={isMinimized}
            onMaximize={openChat}
            onMinimize={minimizeChat}
            onClose={closeChat}
          />
          <div className="h-px bg-black/[0.08]" />
          <ChatMessageList messages={messages} />
          <ChatInputBar isMinimized={isMinimized} onSend={sendMessage} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
