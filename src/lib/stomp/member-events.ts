export type RoomMemberBroadcastType =
  | "MEMBER_JOINED"
  | "MEMBER_LEFT"
  | "MEMBER_KICKED"
  | "HOST_DELEGATED";

/** `/topic/rooms/{roomId}/members` 브로드캐스트 본문 */
export type RoomMemberPayload = {
  content: string;
  createdAt: string;
  id: string;
  metadata: Record<string, unknown>;
  roomId: string;
  type: RoomMemberBroadcastType;
};

function parseMetadata(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

export function parseRoomMemberMessage(body: string): RoomMemberPayload | null {
  try {
    const raw = JSON.parse(body) as Record<string, unknown>;
    const type = raw?.type;
    if (
      type !== "MEMBER_JOINED" &&
      type !== "MEMBER_LEFT" &&
      type !== "MEMBER_KICKED" &&
      type !== "HOST_DELEGATED"
    ) {
      return null;
    }

    const roomIdRaw = raw.roomId;
    const roomId =
      typeof roomIdRaw === "string"
        ? roomIdRaw
        : roomIdRaw != null
          ? String(roomIdRaw)
          : "";

    const content = typeof raw.content === "string" ? raw.content : "";
    const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : "";
    const id =
      typeof raw.id === "string"
        ? raw.id
        : raw.id != null
          ? String(raw.id)
          : "";

    return {
      type,
      roomId,
      content,
      createdAt,
      id,
      metadata: parseMetadata(raw.metadata),
    };
  } catch {
    return null;
  }
}
