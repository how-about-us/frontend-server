export type RoomScheduleEventType =
  | "SCHEDULE_CREATED"
  | "SCHEDULE_DELETED"
  | "SCHEDULE_ITEM_CREATED"
  | "SCHEDULE_ITEM_UPDATED"
  | "SCHEDULE_ITEM_DELETED"
  | "SCHEDULE_ITEMS_REORDERED";

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
    if (
      type === "SCHEDULE_ITEM_DELETED" ||
      type === "SCHEDULE_ITEM_CREATED" ||
      type === "SCHEDULE_ITEMS_REORDERED"
    ) {
      if (
        typeof raw.itemId !== "number" ||
        !Number.isFinite(raw.itemId)
      ) {
        return null;
      }
    }
    return raw as RoomScheduleChangedEvent;
  } catch {
    return null;
  }
}
