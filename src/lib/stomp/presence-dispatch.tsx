"use client";

import type { QueryClient } from "@tanstack/react-query";

import {
  resolveActorPresence,
  roomPresenceToastIcon,
  showRoomBroadcastAlert,
} from "@/components/stomp/RoomBroadcastAlert";

import type { RoomPresenceChangedEvent } from "./events";

/** presence STOMP 한 건 처리 — 토스트 표시까지 */
export async function dispatchRoomPresenceToast(
  queryClient: QueryClient,
  subscribedRoomId: string,
  event: RoomPresenceChangedEvent,
): Promise<void> {
  const trimmed =
    typeof event.nickname === "string" ? event.nickname.trim() : "";

  const payloadImgRaw = event.profileImageUrl;
  const payloadImg =
    typeof payloadImgRaw === "string" && payloadImgRaw.trim().length > 0
      ? payloadImgRaw.trim()
      : null;

  const uid =
    typeof event.userId === "number" && Number.isFinite(event.userId)
      ? event.userId
      : Number(event.userId);

  let displayName = trimmed;
  let profileUrl: string | null = payloadImg;

  if (!displayName || profileUrl === null) {
    const fromMembers = await resolveActorPresence(
      queryClient,
      subscribedRoomId,
      Number.isFinite(uid) ? uid : 0,
    );
    if (!displayName) displayName = fromMembers.nickname;
    if (profileUrl === null) profileUrl = fromMembers.profileImageUrl ?? null;
  }

  const icon = roomPresenceToastIcon(profileUrl);

  if (event.type === "USER_CONNECTED") {
    showRoomBroadcastAlert({
      message: `${displayName}님이 입장했습니다`,
      icon,
    });
  } else if (event.type === "USER_DISCONNECTED") {
    showRoomBroadcastAlert({
      message: `${displayName}님이 퇴장했습니다`,
      icon,
    });
  }
}
