"use client";

import { useCurrentRoomId } from "@/hooks/use-room-id";
import { useJoinRequests, useRoomsList } from "@/hooks/useRooms";
import { selectHostRoom } from "@/lib/rooms";

/** 사이드바 설정 배지 — 현재 방 호스트일 때만 join-requests Query 구독 */
export function useHostJoinRequestsBadgeCount(): number {
  const { roomId } = useCurrentRoomId();
  const { data: roomsData } = useRoomsList();

  const hostRoom = selectHostRoom(
    roomsData?.rooms,
    roomId,
    "currentRoomHostOnly",
  );

  const hostRoomId = hostRoom?.id ?? null;
  const { data } = useJoinRequests(hostRoomId, {
    enabled: Boolean(hostRoomId),
  });

  return data?.requests.length ?? 0;
}
