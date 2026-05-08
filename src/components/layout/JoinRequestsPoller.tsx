"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useJoinRequests, useRoomsList } from "@/hooks/useRooms";
import { selectHostRoom } from "@/lib/rooms/selectHostRoom";
import { useSessionStore } from "@/stores/session-store";

export function JoinRequestsPoller() {
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

  const isOnSettings = pathname.startsWith("/settings");

  const { data: requestsData } = useJoinRequests(hostRoom?.id ?? null, {
    enabled: !!hostRoom,
  });

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
