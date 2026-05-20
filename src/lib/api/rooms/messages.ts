import { apiUrl, requestJson } from "@/lib/api/http";
import type { RoomMessage } from "./types";

export async function getRoomMessages(
  roomId: string,
  params?: { afterId?: string; beforeId?: string; size?: number },
): Promise<RoomMessage[]> {
  const url = new URL(apiUrl(`/rooms/${roomId}/messages`));
  if (params?.afterId) url.searchParams.set("afterId", params.afterId);
  if (params?.beforeId) url.searchParams.set("beforeId", params.beforeId);
  if (params?.size !== undefined)
    url.searchParams.set("size", String(params.size));

  return requestJson(url.toString(), undefined, {
    errorMessage: "메시지 목록 조회 실패",
  });
}

export async function getRoomUnreadCount(
  roomId: string,
): Promise<{ unreadCount: number }> {
  return requestJson(
    apiUrl(`/rooms/${roomId}/messages/unread-count`),
    undefined,
    {
      errorMessage: "안읽은 메시지 수 조회 실패",
    },
  );
}
