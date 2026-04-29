"use client";

import { useSessionStore } from "@/stores/session-store";
import { useRoomsList } from "@/hooks/useRooms";
import { JoinRequestsSection } from "./JoinRequestsSection";

export function SettingsHostGuard() {
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const { data: roomsData } = useRoomsList();

  // currentRoomId가 있으면 그 방 우선, 없으면 HOST 권한인 첫 번째 방
  const hostRoom =
    roomsData?.rooms.find((r) => r.id === currentRoomId && r.role === "HOST") ??
    roomsData?.rooms.find((r) => r.role === "HOST");

  if (!hostRoom) return null;

  return <JoinRequestsSection roomId={hostRoom.id} />;
}
