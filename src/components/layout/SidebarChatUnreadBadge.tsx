"use client";

import { useChatUnreadStore } from "@/stores/chat-unread-store";

export function SidebarChatUnreadBadge() {
  const chatCnt = useChatUnreadStore((s) => s.chatCnt);
  const label = chatCnt === 0 ? "-" : chatCnt >= 100 ? "99+" : chatCnt;

  return (
    <span className="pointer-events-none absolute text-xs font-bold text-white">
      {label}
    </span>
  );
}
