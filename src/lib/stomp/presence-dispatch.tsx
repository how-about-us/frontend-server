"use client";

import type { QueryClient } from "@tanstack/react-query";

import {
  roomPresenceToastIcon,
  showRoomBroadcastAlert,
} from "@/components/stomp/RoomBroadcastAlert";
import { useRoomPresenceStore } from "@/stores/room-presence-store";

import type { RoomPresenceChangedEvent } from "./events";
import {
  resolvePresenceDisplayName,
  resolvePresenceProfileImageUrl,
} from "./room-member-display";

/** presence STOMP 한 건 — 온·오프라인·토스트 */
export function dispatchRoomPresenceToast(
  queryClient: QueryClient,
  subscribedRoomId: string,
  event: RoomPresenceChangedEvent,
): void {
  const uid =
    typeof event.userId === "number" && Number.isFinite(event.userId)
      ? event.userId
      : Number(event.userId);

  const uidFinite = Number.isFinite(uid) ? uid : 0;

  const displayName = resolvePresenceDisplayName(
    queryClient,
    subscribedRoomId,
    uidFinite,
    event.nickname,
  );
  const iconUrl = resolvePresenceProfileImageUrl(
    queryClient,
    subscribedRoomId,
    uidFinite,
    event.profileImageUrl,
  );
  const icon = roomPresenceToastIcon(iconUrl);

  if (event.type === "USER_CONNECTED") {
    useRoomPresenceStore.getState().setUserOnline(subscribedRoomId, uidFinite);
    showRoomBroadcastAlert({
      message: `${displayName}님이 온라인 상태입니다.`,
      icon,
    });
    return;
  }

  if (event.type === "USER_DISCONNECTED") {
    useRoomPresenceStore
      .getState()
      .setUserOffline(subscribedRoomId, uidFinite);
    showRoomBroadcastAlert({
      message: `${displayName}님은 오프라인 상태입니다`,
      icon,
    });
  }
}
