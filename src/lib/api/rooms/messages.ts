import { apiUrl, requestJson } from "@/lib/api/http";
import type { RoomMessage } from "./types";

export async function getRoomMessages(
  roomId: string,
  params?: { afterId?: string; size?: number },
): Promise<RoomMessage[]> {
  const url = new URL(apiUrl(`/rooms/${roomId}/messages`));
  if (params?.afterId) url.searchParams.set("afterId", params.afterId);
  if (params?.size !== undefined)
    url.searchParams.set("size", String(params.size));

  return requestJson(url.toString(), undefined, {
    errorMessage: "메시지 목록 조회 실패",
  });
}
