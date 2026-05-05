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

/**
 * members STOMP 한 건 — `room-members` 무효화로 GET /rooms/{roomId}/members 가 다시 채워지고,
 * 채팅 UI는 그 쿼리 캐시의 userId와 메시지 senderId만 매핑해 발신자를 표시합니다.
 * (시스템/AI 말풍선은 messageType 분기 유지)
 */
export async function dispatchRoomMemberEvent(
  queryClient: QueryClient,
  subscribedRoomId: string,
  event: RoomMemberPayload,
): Promise<void> {
  const rid = String(event.roomId ?? "").trim() || subscribedRoomId;
  await invalidateMembershipRelatedQueries(queryClient, rid);
}
