/** `/topic/rooms/{roomId}/lifecycle` — 방 삭제 등 라이프사이클 브로드캐스트 */
export type RoomLifecycleDeletedPayload = {
  type: "ROOM_DELETED";
  roomId: string;
  message: string;
  createdAt: string;
};

export function parseRoomLifecycleMessage(
  body: string,
): RoomLifecycleDeletedPayload | null {
  try {
    const raw = JSON.parse(body) as Record<string, unknown>;
    if (raw?.type !== "ROOM_DELETED") return null;

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
    const createdAt =
      typeof raw.createdAt === "string" ? raw.createdAt : "";

    return {
      type: "ROOM_DELETED",
      roomId,
      message,
      createdAt,
    };
  } catch {
    return null;
  }
}
