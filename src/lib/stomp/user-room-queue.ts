/** `/user/queue/rooms` — 추방·방 삭제·(호스트) 입장 요청 등 개인 큐 */

export type ForcedRoomExitReason = "kicked" | "room_deleted";

export type UserRoomQueueMessage =
  | {
      kind: "forced_exit";
      reason: ForcedRoomExitReason;
      roomId: string;
      message?: string;
    }
  | {
      kind: "join_request";
      roomId: string;
      requesterId: number;
      nickname: string;
      profileImageUrl: string | null;
    };

/**
 * 서버 페이로드 계약(클라 검증):
 * - `roomId`: 비어 있지 않은 문자열
 * - 입장 요청: 유한한 `requesterId`(숫자 또는 숫자 문자열) 필수. 없으면 `null` 반환
 * - `KICKED` / `ROOM_DELETED`: `actionType` + `roomId` (+ optional `message`)
 */
function parseOptionalServerMessage(raw: Record<string, unknown>): string | undefined {
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  return message || undefined;
}

export function parseUserRoomQueueMessage(
  body: string,
): UserRoomQueueMessage | null {
  try {
    const raw = JSON.parse(body) as Record<string, unknown>;
    const actionType =
      typeof raw?.actionType === "string" ? raw.actionType : "";

    const roomIdRaw = raw.roomId;
    const roomId =
      typeof roomIdRaw === "string"
        ? roomIdRaw.trim()
        : roomIdRaw != null
          ? String(roomIdRaw).trim()
          : "";
    if (!roomId) return null;

    const serverMessage = parseOptionalServerMessage(raw);

    if (actionType === "KICKED") {
      return {
        kind: "forced_exit",
        reason: "kicked",
        roomId,
        ...(serverMessage ? { message: serverMessage } : {}),
      };
    }
    if (actionType === "ROOM_DELETED") {
      return {
        kind: "forced_exit",
        reason: "room_deleted",
        roomId,
        ...(serverMessage ? { message: serverMessage } : {}),
      };
    }

    /** 입장 요청: 명세 actionType 과 무관하게 requesterId 가 있으면 처리 (서버 enum 변형 대비) */
    const requesterIdRaw = raw.requesterId;
    const requesterId =
      typeof requesterIdRaw === "number"
        ? requesterIdRaw
        : typeof requesterIdRaw === "string"
          ? Number(requesterIdRaw)
          : NaN;
    if (!Number.isFinite(requesterId)) return null;

    const nickname =
      typeof raw.nickname === "string" ? raw.nickname.trim() : "";
    const profileImageUrlRaw = raw.profileImageUrl;
    const profileImageUrl =
      typeof profileImageUrlRaw === "string" && profileImageUrlRaw.trim()
        ? profileImageUrlRaw.trim()
        : null;

    return {
      kind: "join_request",
      roomId,
      requesterId,
      nickname,
      profileImageUrl,
    };
  } catch {
    return null;
  }
}
