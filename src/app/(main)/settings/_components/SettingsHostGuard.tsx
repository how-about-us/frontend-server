"use client";

import { useSessionStore } from "@/stores/session-store";
import { useRoomsList } from "@/hooks/useRooms";
import { JoinRequestsSection } from "./JoinRequestsSection";

export function SettingsHostGuard() {
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const { data: roomsData } = useRoomsList();
  const currentRoom = roomsData?.rooms.find((r) => r.id === currentRoomId);
  const isHost = currentRoom?.role === "HOST";

  if (!isHost || !currentRoomId) return null;

  return <JoinRequestsSection roomId={currentRoomId} />;
}
