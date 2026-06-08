"use client";

import type { QueryClient } from "@tanstack/react-query";

import { invalidateRoomBookmarkQueries } from "@/lib/bookmarks-invalidation";
import { readSessionUserId } from "@/lib/session-user-cache";
import type { RoomBookmarkChangedEvent } from "@/types/roomBookmarkStomp";

/** bookmarks 토픽 STOMP — React Query 무효화만 (토스트·선 fetch 없음) */
export async function applyRoomBookmarkStompMessage(
  queryClient: QueryClient,
  messageBody: string,
): Promise<void> {
  const event = JSON.parse(messageBody) as RoomBookmarkChangedEvent;
  const rid = String(event.roomId ?? "").trim();
  if (!rid) return;

  const me = readSessionUserId(queryClient);
  const actorIsMe =
    typeof me === "number" &&
    Number.isFinite(me) &&
    me === event.actorUserId;
  /** 본인 mutation은 `onSuccess`에서 캐시 패치 */
  if (actorIsMe) {
    return;
  }

  await invalidateRoomBookmarkQueries(queryClient, event);
}
