"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/useChat";
import { useCurrentRoomTitle } from "@/hooks/useCurrentRoomTitle";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useCurrentRoomId } from "@/hooks/use-room-id";
import { useRoomMembers } from "@/hooks/useRooms";
import { ChatPanelHeader } from "./ChatPanelHeader";
import { ChatMessageList } from "./messages/ChatMessageList";
import { ChatInputBar } from "./ChatInputBar";
import { ChatRateLimitBanner } from "./ChatRateLimitBanner";
import { useChatRateLimitStore } from "@/stores/chat-rate-limit-store";
import {
  panelVariants,
  panelTransition,
  getPanelAnimate,
} from "./chat-animations";

export function ChatPanel() {
  const router = useRouter();
  const { chatState, openChat, minimizeChat, closeChat } = useChat();
  const isMinimized = chatState === "minimized";
  const panelOpen = chatState !== "closed";
  const { roomId } = useCurrentRoomId();
  const title = useCurrentRoomTitle(roomId);
  const { data: membersData } = useRoomMembers(roomId);
  const onlineCount =
    membersData?.members.filter((m) => m.isOnline).length ?? 0;
  const {
    messages,
    sendChatMessage,
    sendAiMessage,
    sendCancelAiRequest,
    fetchOlderMessages,
    jumpToLatest,
    hasMore,
    hasMoreNewer,
    isFetchingOlder,
    initialScrollAnchorId,
    markMessagesRead,
  } = useChatMessages(roomId, { fetchHistory: panelOpen });

  const rid = typeof roomId === "string" ? roomId.trim() : "";
  const rateLimit = useChatRateLimitStore((s) => s.rateLimit);
  const isSendBlocked = useChatRateLimitStore((s) => s.isSendBlocked);

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
              : "absolute top-0 left-0 bottom-0 z-10 flex w-s1 flex-col overflow-hidden bg-white"
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
          <ChatMessageList
            key={rid || "no-room"}
            messages={messages}
            isMinimized={isMinimized}
            onCancelAiRequest={sendCancelAiRequest}
            onLoadOlder={fetchOlderMessages}
            hasMoreOlder={hasMore}
            isLoadingOlder={isFetchingOlder}
            hasMoreNewer={hasMoreNewer}
            onJumpToLatest={jumpToLatest}
            initialScrollAnchorId={initialScrollAnchorId}
            onAtBottom={markMessagesRead}
          />
          <AnimatePresence initial={false}>
            {rateLimit ? (
              <ChatRateLimitBanner
                key="chat-rate-limit"
                message={rateLimit.message}
                isMinimized={isMinimized}
              />
            ) : null}
          </AnimatePresence>
          <ChatInputBar
            isMinimized={isMinimized}
            onSendChat={sendChatMessage}
            onSendAi={sendAiMessage}
            onPlusClick={handlePlusClick}
            plusDisabled={!rid}
            sendDisabled={isSendBlocked}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
