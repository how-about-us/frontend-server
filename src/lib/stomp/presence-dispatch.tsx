"use client";

import type { QueryClient } from "@tanstack/react-query";

import type { RoomMemberListResponse } from "@/lib/api/rooms";
import type { RoomPresenceChangedEvent } from "@/lib/stomp/events";
import { roomMembersQueryKey } from "@/lib/query-keys";

/** presence STOMP — 해당 유저 `isOnline`만 캐시 패치 (GET 없음). */
export function dispatchRoomPresence(
  queryClient: QueryClient,
  roomId: string,
  event: RoomPresenceChangedEvent,
): void {
  const rid = roomId.trim();
  if (!rid.length || !event.userId) return;

  const isOnline = event.type === "USER_CONNECTED";

  queryClient.setQueryData<RoomMemberListResponse>(
    roomMembersQueryKey(rid),
    (prev) => {
      if (!prev?.members?.length) return prev;
      let touched = false;
      const members = prev.members.map((m) => {
        if (m.userId !== event.userId) return m;
        touched = true;
        return { ...m, isOnline };
      });
      if (!touched) return prev;
      return { ...prev, members };
    },
  );
}

/** 구독 직후 — 멤버 캐시가 비었을 때만 GET 유도 (첫 진입·재구독). */
export async function syncRoomMembersIfCacheEmpty(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  const rid = roomId.trim();
  if (!rid.length) return;

  const cached = queryClient.getQueryData<RoomMemberListResponse>(
    roomMembersQueryKey(rid),
  );
  if (cached?.members?.length) return;

  await queryClient.invalidateQueries({
    queryKey: roomMembersQueryKey(rid),
    refetchType: "active",
  });
}
