export type RoomPresenceEventType =
  | "USER_CONNECTED"
  | "USER_DISCONNECTED";

/** `/topic/rooms/{roomId}/presence` 브로드캐스트 본문 */
export type RoomPresenceChangedEvent = {
  nickname: string | null;
  profileImageUrl: string | null;
  roomId: string;
  type: RoomPresenceEventType;
  userId: number;
};

export function parseRoomPresenceMessage(
  body: string,
): RoomPresenceChangedEvent | null {
  try {
    const raw = JSON.parse(body) as RoomPresenceChangedEvent;
    const type = raw?.type;
    if (type !== "USER_CONNECTED" && type !== "USER_DISCONNECTED") {
      return null;
    }
    return raw;
  } catch {
    return null;
  }
}
