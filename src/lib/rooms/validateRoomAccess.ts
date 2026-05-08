import { apiFetch } from "@/lib/api/client";
import { apiUrl } from "@/lib/api/http";

export type RoomAccessVerdict = "ok" | "forbidden" | "error";

/**
 * Persist된 `currentRoomId` 등이 서버에서 여전히 유효한지 확인합니다.
 * 네트워크 오류 등은 `"error"`로 두고 스토어는 건드리지 않습니다.
 */
export async function validateRoomAccess(
  roomId: string,
): Promise<RoomAccessVerdict> {
  const rid = roomId.trim();
  if (!rid.length) return "error";
  try {
    const res = await apiFetch(apiUrl(`/rooms/${rid}`));
    if (res.ok) return "ok";
    if (res.status === 403 || res.status === 404) return "forbidden";
    return "error";
  } catch {
    return "error";
  }
}
