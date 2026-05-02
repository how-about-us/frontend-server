export type RoomScheduleEventType =
  | "SCHEDULE_CREATED"
  | "SCHEDULE_DELETED"
  | "SCHEDULE_ITEM_CREATED"
  | "SCHEDULE_ITEM_UPDATED"
  | "SCHEDULE_ITEM_DELETED"
  | "SCHEDULE_ITEMS_REORDERED"
  | "TRAVEL_MODE_UPDATED";

/** `/topic/rooms/{roomId}/schedules` 브로드캐스트 본문 */
export type RoomScheduleChangedEvent = {
  actorUserId: number;
  itemId: number;
  roomId: string;
  scheduleId: number;
  type: RoomScheduleEventType;
};

const KNOWN_TYPES = new Set<string>([
  "SCHEDULE_CREATED",
  "SCHEDULE_DELETED",
  "SCHEDULE_ITEM_CREATED",
  "SCHEDULE_ITEM_UPDATED",
  "SCHEDULE_ITEM_DELETED",
  "SCHEDULE_ITEMS_REORDERED",
  "TRAVEL_MODE_UPDATED",
]);

export function parseRoomScheduleMessage(
  body: string,
): RoomScheduleChangedEvent | null {
  try {
    const raw = JSON.parse(body) as Partial<RoomScheduleChangedEvent>;
    const roomId = String(raw.roomId ?? "").trim();
    const scheduleId = raw.scheduleId;
    const type = raw.type;
    if (
      !roomId ||
      typeof scheduleId !== "number" ||
      typeof type !== "string" ||
      !KNOWN_TYPES.has(type)
    ) {
      return null;
    }
    return raw as RoomScheduleChangedEvent;
  } catch {
    return null;
  }
}
