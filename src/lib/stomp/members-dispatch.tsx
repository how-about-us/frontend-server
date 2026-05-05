"use client";

import type { QueryClient } from "@tanstack/react-query";

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

export type RoomMemberChatLine = {
  id: string;
  text: string;
  createdAt: string;
};

const memberChatListeners = new Map<
  string,
  (line: RoomMemberChatLine) => void
>();

/** 채팅 패널이 방별로 등록 — 단일 리스너 */
export function setRoomMemberChatListener(
  roomId: string,
  listener: ((line: RoomMemberChatLine) => void) | null,
): void {
  const rid = roomId.trim();
  if (listener) {
    memberChatListeners.set(rid, listener);
  } else {
    memberChatListeners.delete(rid);
  }
}

function emitMemberChatLine(roomId: string, line: RoomMemberChatLine): void {
  memberChatListeners.get(roomId)?.(line);
}

/** members STOMP 한 건 — 쿼리 무효화 후 채팅용 시스템 메시지로 전달 */
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

  let text: string;

  if (event.type === "HOST_DELEGATED") {
    text =
      contentTrimmed.length > 0 ? contentTrimmed : HOST_DELEGATED_DEFAULT_MSG;
  } else if (contentTrimmed.length > 0) {
    text = contentTrimmed;
  } else {
    return;
  }

  const lineId =
    typeof event.id === "string" && event.id.length > 0 ? event.id : crypto.randomUUID();

  emitMemberChatLine(rid, {
    id: lineId,
    text,
    createdAt: typeof event.createdAt === "string" ? event.createdAt : "",
  });
}
