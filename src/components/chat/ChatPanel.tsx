"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMainChromeLayoutWidth } from "@/contexts/MainChromeLayoutWidthContext";
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
  const { chatPanelDockWidthCss, chatPanelRevealReady } =
    useMainChromeLayoutWidth();
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

  const panelBody = (
    <>
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
    </>
  );

  return (
    <AnimatePresence mode="wait">
      {chatState === "minimized" ? (
        <motion.div
          key="chat-panel-minimized"
          layout
          variants={panelVariants}
          initial="hidden"
          animate={getPanelAnimate(true)}
          exit="exit"
          transition={panelTransition}
          className="absolute bottom-6 right-6 z-20 flex h-[460px] w-72 flex-col overflow-hidden border border-gray-border bg-white"
        >
          {panelBody}
        </motion.div>
      ) : null}
      {chatState === "maximized" && chatPanelRevealReady ? (
        <motion.div
          key="chat-panel-maximized"
          variants={panelVariants}
          initial="hidden"
          animate={getPanelAnimate(false)}
          exit="exit"
          transition={panelTransition}
          style={
            chatPanelDockWidthCss ? { width: chatPanelDockWidthCss } : undefined
          }
          className="absolute top-0 left-0 bottom-0 z-10 flex min-w-0 w-s1 flex-col overflow-hidden bg-white"
        >
          {panelBody}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
