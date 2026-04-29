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
  const currentRoom = roomsData?.rooms.find((r) => r.id === currentRoomId);
  const isHost = currentRoom?.role === "HOST";

  // On the settings page, JoinRequestsSection owns the count; avoid double-setting
  const isOnSettings = pathname.startsWith("/settings");

  const { data: requestsData } = useJoinRequests(
    isHost && !isOnSettings ? currentRoomId : null,
  );

  useEffect(() => {
    if (isOnSettings) return;
    setPendingJoinRequestsCount(requestsData?.requests.length ?? 0);
  }, [requestsData, isOnSettings, setPendingJoinRequestsCount]);

  // Reset count when navigating to settings (section takes over)
  useEffect(() => {
    if (isOnSettings) {
      setPendingJoinRequestsCount(0);
    }
  }, [isOnSettings, setPendingJoinRequestsCount]);

  return null;
}
