"use client";

import { useCurrentRoomId } from "@/hooks/use-room-id";
import { useRoomUnreadCount } from "@/hooks/useRooms";

export function SidebarChatUnreadBadge() {
  const { roomId } = useCurrentRoomId();
  const { data } = useRoomUnreadCount(roomId);
  const unreadCount = data?.unreadCount ?? 0;
  const label =
    !roomId || unreadCount === 0
      ? "-"
      : unreadCount >= 100
        ? "99+"
        : unreadCount;

  return (
    <span className="pointer-events-none absolute text-xs font-bold text-white">
      {label}
    </span>
  );
}
