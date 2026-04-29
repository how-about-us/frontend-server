"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useJoinRequests, useRoomsList } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";

export function JoinRequestsPoller() {
  const pathname = usePathname();
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const setPendingJoinRequestsCount = useSessionStore(
    (s) => s.setPendingJoinRequestsCount,
  );

  const { data: roomsData } = useRoomsList();

  // currentRoomId가 있으면 그 방 우선, 없으면 HOST 권한인 첫 번째 방
  const hostRoom =
    roomsData?.rooms.find((r) => r.id === currentRoomId && r.role === "HOST") ??
    roomsData?.rooms.find((r) => r.role === "HOST");

  const isOnSettings = pathname.startsWith("/settings");

  const { data: requestsData } = useJoinRequests(
    hostRoom && !isOnSettings ? hostRoom.id : null,
  );

  useEffect(() => {
    if (isOnSettings) return;
    setPendingJoinRequestsCount(requestsData?.requests.length ?? 0);
  }, [requestsData, isOnSettings, setPendingJoinRequestsCount]);

  useEffect(() => {
    if (isOnSettings) {
      setPendingJoinRequestsCount(0);
    }
  }, [isOnSettings, setPendingJoinRequestsCount]);

  return null;
}
