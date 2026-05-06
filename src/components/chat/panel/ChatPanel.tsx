"use client";

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useChat } from "@/contexts/ChatContext";
import { useChatMessages } from "@/hooks/useChatMessages";
import { getRoomDetail } from "@/lib/api/rooms";
import { useRoomMembers } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";
import { ChatPanelHeader } from "./ChatPanelHeader";
import { ChatMessageList } from "../messages/ChatMessageList";
import { ChatInputBar } from "../input/ChatInputBar";
import {
  panelVariants,
  panelTransition,
  getPanelAnimate,
} from "../lib/chat.animations";

export function ChatPanel() {
  const router = useRouter();
  const { chatState, openChat, minimizeChat, closeChat } = useChat();
  const isMinimized = chatState === "minimized";
  const roomId = useSessionStore((s) => s.currentRoomId);
  const sessionRoomTitle = useSessionStore((s) => s.currentRoomMeta?.title);
  const { data: membersData } = useRoomMembers(roomId);
  const onlineCount =
    membersData?.members.filter((m) => m.isOnline).length ?? 0;
  const { messages, sendChatMessage, sendAiMessage } = useChatMessages(roomId);

  const rid = typeof roomId === "string" ? roomId.trim() : "";
  const { data: roomDetail } = useQuery({
    queryKey: ["room-detail", rid],
    queryFn: () => getRoomDetail(rid),
    enabled: rid.length > 0,
  });

  const title =
    sessionRoomTitle?.trim() ||
    roomDetail?.title?.trim() ||
    "채팅";

  function handlePlusClick() {
    if (!rid) return;
    router.push("/search?share=chat");
    minimizeChat();
  }

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
            roomTitle={title}
            onlineCount={onlineCount}
            isMinimized={isMinimized}
            onMaximize={openChat}
            onMinimize={minimizeChat}
            onClose={closeChat}
          />
          <div className="h-px bg-black/[0.08]" />
          <ChatMessageList messages={messages} />
          <ChatInputBar
            isMinimized={isMinimized}
            onSendChat={sendChatMessage}
            onSendAi={sendAiMessage}
            onPlusClick={handlePlusClick}
            plusDisabled={!rid}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
