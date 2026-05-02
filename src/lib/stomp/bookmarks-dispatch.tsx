"use client";

import type { QueryClient } from "@tanstack/react-query";

import {
  buildBookmarkBroadcastMessage,
  type RoomBookmarkChangedEvent,
  RoomBroadcastBookmarkIcon,
  showRoomBroadcastAlert,
} from "@/components/stomp/RoomBroadcastAlert";
import { invalidateRoomBookmarkQueries } from "@/hooks/useRooms";

/** bookmarks 토픽 STOMP 한 건 처리 — 무효화 후 토스트 */
export async function dispatchRoomBookmarksToast(
  queryClient: QueryClient,
  messageBody: string,
): Promise<void> {
  const event = JSON.parse(messageBody) as RoomBookmarkChangedEvent;
  const rid = String(event.roomId ?? "").trim();
  if (!rid) return;

  const msg = await buildBookmarkBroadcastMessage(queryClient, event);
  await invalidateRoomBookmarkQueries(queryClient, rid);
  showRoomBroadcastAlert({
    message: msg,
    icon: <RoomBroadcastBookmarkIcon />,
  });
}
