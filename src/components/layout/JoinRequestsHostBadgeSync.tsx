"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useRoomsList } from "@/hooks/useRooms";
import { selectHostRoom } from "@/lib/rooms";
import { useSessionStore } from "@/stores/session-store";

/**
 * 현재 방이 호스트 방이 아니거나 설정 화면이면 배지를 0으로 맞춤.
 * 목록 GET은 settings 마운트·STOMP 수신 때만 수행합니다.
 */
export function JoinRequestsHostBadgeSync() {
  const pathname = usePathname();
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const setPendingJoinRequestsCount = useSessionStore(
    (s) => s.setPendingJoinRequestsCount,
  );
  const { data: roomsData } = useRoomsList();

  const hostRoom = selectHostRoom(
    roomsData?.rooms,
    currentRoomId,
    "currentRoomHostOnly",
  );

  useEffect(() => {
    if (pathname.startsWith("/settings")) {
      setPendingJoinRequestsCount(0);
      return;
    }
    if (!hostRoom) {
      setPendingJoinRequestsCount(0);
    }
  }, [pathname, hostRoom?.id, setPendingJoinRequestsCount]);

  return null;
}
