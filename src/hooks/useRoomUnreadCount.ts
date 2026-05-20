"use client";

import { useQuery } from "@tanstack/react-query";

import { getRoomUnreadCount } from "@/lib/api/rooms";
import { roomUnreadCountQueryKey } from "@/lib/query-keys";
import { useChatPanelStore } from "@/stores/chat-panel-store";

export function useRoomUnreadCount(roomId: string | null) {
  const id = roomId?.trim() ?? "";
  const chatPanelOpen = useChatPanelStore((s) => s.chatState !== "closed");

  return useQuery({
    queryKey: roomUnreadCountQueryKey(id || null),
    queryFn: () => getRoomUnreadCount(id),
    /** 패널 열림 중에는 GET 없음 — STOMP read + optimistic 캐시만 사용 */
    enabled: id.length > 0 && !chatPanelOpen,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
