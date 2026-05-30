"use client";

import { useSessionStore } from "@/stores/session-store";
import { useRoomsList } from "@/hooks/useRooms";
import { selectHostRoom } from "@/lib/rooms";
import { JoinRequestsSection } from "./JoinRequestsSection";

export function SettingsHostGuard() {
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const { data: roomsData } = useRoomsList();

  const hostRoom = selectHostRoom(
    roomsData?.rooms,
    currentRoomId,
    "anyHostedRoom",
  );

  if (!hostRoom) return null;

  return <JoinRequestsSection roomId={hostRoom.id} />;
}
