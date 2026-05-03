"use client";

import type { QueryClient } from "@tanstack/react-query";

import {
  resolveActorPresence,
  roomPresenceToastIcon,
  showRoomBroadcastAlert,
} from "@/components/stomp/RoomBroadcastAlert";
import { getRoomMembers } from "@/lib/api/rooms";
import { ROOMS_QUERY_KEY } from "@/hooks/useRooms";
import { useRoomPresenceStore } from "@/stores/room-presence-store";

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

  const uidFinite = Number.isFinite(uid) ? uid : 0;

  if (event.type === "USER_CONNECTED") {
    let displayName = trimmed;
    let profileUrl: string | null = payloadImg;

    if (!displayName || profileUrl === null) {
      const fromMembers = await resolveActorPresence(
        queryClient,
        subscribedRoomId,
        uidFinite,
      );
      if (!displayName) displayName = fromMembers.nickname;
      if (profileUrl === null) profileUrl = fromMembers.profileImageUrl ?? null;
    }

    const icon = roomPresenceToastIcon(profileUrl);
    useRoomPresenceStore.getState().setUserOnline(subscribedRoomId, uidFinite);
    showRoomBroadcastAlert({
      message: `${displayName}님이 온라인 상태입니다.`,
      icon,
    });
    await invalidatePresenceRelatedQueries(queryClient, subscribedRoomId);
    return;
  }

  if (event.type === "USER_DISCONNECTED") {
    let fresh;
    try {
      fresh = await getRoomMembers(subscribedRoomId);
    } catch {
      await invalidatePresenceRelatedQueries(queryClient, subscribedRoomId);
      return;
    }

    queryClient.setQueryData(["room-members", subscribedRoomId], fresh);
    useRoomPresenceStore
      .getState()
      .setUserOffline(subscribedRoomId, uidFinite);

    const row = fresh.members.find((m) => m.userId === uidFinite);
    const displayName =
      trimmed ||
      row?.nickname?.trim() ||
      (uidFinite > 0 ? `유저 #${uidFinite}` : "알 수 없는 사용자");
    const profileUrl = payloadImg ?? row?.profileImageUrl ?? null;
    const icon = roomPresenceToastIcon(profileUrl);
    const stillMember = fresh.members.some((m) => m.userId === uidFinite);

    showRoomBroadcastAlert({
      message: stillMember
        ? `${displayName}님은 오프라인 상태입니다`
        : `${displayName}님은 방을 나갔습니다`,
      icon,
    });
    await invalidatePresenceRelatedQueries(queryClient, subscribedRoomId);
  }
}
