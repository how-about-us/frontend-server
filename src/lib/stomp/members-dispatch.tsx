"use client";

import type { QueryClient } from "@tanstack/react-query";

import { ROOMS_QUERY_KEY } from "@/hooks/useRooms";

import type { RoomMemberPayload } from "./member-events";

async function invalidateMembershipRelatedQueries(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["room-members", roomId],
    }),
    queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY }),
  ]);
}

/** members STOMP 한 건 — 멤버·방 목록 쿼리만 갱신 (채팅 시스템 메시지는 `/messages` 스트림만 사용) */
export async function dispatchRoomMemberEvent(
  queryClient: QueryClient,
  subscribedRoomId: string,
  event: RoomMemberPayload,
): Promise<void> {
  const rid = String(event.roomId ?? "").trim() || subscribedRoomId;
  await invalidateMembershipRelatedQueries(queryClient, rid);
}
