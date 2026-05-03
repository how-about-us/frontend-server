"use client";

import type { QueryClient } from "@tanstack/react-query";

import {
  resolveActorPresence,
  roomPresenceToastIcon,
  showRoomBroadcastAlert,
} from "@/components/stomp/RoomBroadcastAlert";
import { ROOMS_QUERY_KEY } from "@/hooks/useRooms";

import type { RoomPresenceChangedEvent } from "./events";

/** 명세 상 USER_CONNECTED · USER_DISCONNECTED 시 멤버/방/입장 요청 목록 활성 구독자 전부 재조회 */
async function invalidatePresenceRelatedQueries(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["room-members", roomId],
    }),
    queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY }),
    queryClient.invalidateQueries({
      queryKey: ["join-requests", roomId],
    }),
  ]);
}

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
  } else {
    return;
  }

  await invalidatePresenceRelatedQueries(queryClient, subscribedRoomId);
}
