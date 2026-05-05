"use client";

import { useRoomPresenceStore } from "@/stores/room-presence-store";

import type { RoomPresenceChangedEvent } from "./events";

/** presence STOMP 한 건 — 온·오프라인 스토어만 갱신 (토스트 없음) */
export function dispatchRoomPresence(
  subscribedRoomId: string,
  event: RoomPresenceChangedEvent,
): void {
  const uid =
    typeof event.userId === "number" && Number.isFinite(event.userId)
      ? event.userId
      : Number(event.userId);

  const uidFinite = Number.isFinite(uid) ? uid : 0;

  if (event.type === "USER_CONNECTED") {
    useRoomPresenceStore.getState().setUserOnline(subscribedRoomId, uidFinite);
    return;
  }

  if (event.type === "USER_DISCONNECTED") {
    useRoomPresenceStore
      .getState()
      .setUserOffline(subscribedRoomId, uidFinite);
  }
}
