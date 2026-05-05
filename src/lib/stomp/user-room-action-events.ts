/** `/user/queue/rooms` — 추방·방 삭제 시 당사자 개인 큐 */
export type UserRoomActionType = "KICKED" | "ROOM_DELETED";

export type UserRoomActionPayload = {
  actionType: UserRoomActionType;
  roomId: string;
  message: string;
};

export function parseUserRoomActionMessage(
  body: string,
): UserRoomActionPayload | null {
  try {
    const raw = JSON.parse(body) as Record<string, unknown>;
    const actionType = raw?.actionType;
    if (actionType !== "KICKED" && actionType !== "ROOM_DELETED") {
      return null;
    }

    const roomIdRaw = raw.roomId;
    const roomId =
      typeof roomIdRaw === "string"
        ? roomIdRaw.trim()
        : roomIdRaw != null
          ? String(roomIdRaw).trim()
          : "";
    if (!roomId) return null;

    const message =
      typeof raw.message === "string" ? raw.message : "";

    return {
      actionType,
      roomId,
      message,
    };
  } catch {
    return null;
  }
}
