"use client";

import type { QueryClient } from "@tanstack/react-query";

import { showRoomBroadcastAlert } from "@/components/stomp/RoomBroadcastAlert";
import { ROOMS_QUERY_KEY } from "@/hooks/useRooms";

import type { RoomMemberPayload } from "./member-events";
import { substitutePlaceholderMemberLabelsInContent } from "./room-member-display";

async function invalidateMembershipRelatedQueries(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["room-members", roomId],
    }),
    queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY }),
  ]);
}

const HOST_DELEGATED_DEFAULT_MSG = "방장 권한이 위임되었습니다.";

/** members STOMP 한 건 — 쿼리 무효화 후 토스트(명세·서버 content 기준) */
export async function dispatchRoomMemberEvent(
  queryClient: QueryClient,
  subscribedRoomId: string,
  event: RoomMemberPayload,
): Promise<void> {
  const rid = String(event.roomId ?? "").trim() || subscribedRoomId;

  await invalidateMembershipRelatedQueries(queryClient, rid);

  let contentTrimmed =
    typeof event.content === "string" ? event.content.trim() : "";

  contentTrimmed = substitutePlaceholderMemberLabelsInContent(
    queryClient,
    rid,
    contentTrimmed,
    event.metadata,
  );

  if (event.type === "HOST_DELEGATED") {
    showRoomBroadcastAlert({
      message:
        contentTrimmed.length > 0 ? contentTrimmed : HOST_DELEGATED_DEFAULT_MSG,
    });
    return;
  }

  if (contentTrimmed.length > 0) {
    showRoomBroadcastAlert({ message: contentTrimmed });
  }
}
