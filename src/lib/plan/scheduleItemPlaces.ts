import { getScheduleItems } from "@/lib/api/rooms/schedule-items";
import { getPlaceDetail } from "@/lib/api/places";
import type { PlanPlace } from "@/lib/plan/types";

/** 새 항목 POST 시 `startTime` — `HH:mm` (로컬 슬롯: 08:00부터 번호당 1시간, 최대 22:00) */
export function slotStartTimeHm(itemIndex: number): string {
  const hour = Math.min(8 + itemIndex, 22);
  return `${String(hour).padStart(2, "0")}:00`;
}

/** 드래그를 `toIndex` 자리에 놓았을 때 PATCH에 넣을 `newOrderIndex`(0-based) */
export function newOrderIndexAfterMove(
  fromIndex: number,
  toIndex: number,
  length: number,
): number {
  if (length <= 0 || fromIndex < 0 || toIndex < 0 || fromIndex >= length) {
    return Math.min(Math.max(toIndex, 0), Math.max(length - 1, 0));
  }
  const cappedTo = Math.min(toIndex, length - 1);
  if (fromIndex === cappedTo) return fromIndex;
  const order = Array.from({ length }, (_, i) => i);
  const [moved] = order.splice(fromIndex, 1);
  order.splice(cappedTo, 0, moved);
  return order.indexOf(moved);
}

export async function fetchScheduleItemsAsPlanPlaces(
  roomId: string,
  scheduleId: number,
): Promise<PlanPlace[]> {
  const items = await getScheduleItems(roomId, scheduleId);
  const sorted = [...items].sort((a, b) => a.orderIndex - b.orderIndex);
  return Promise.all(
    sorted.map(async (item) => {
      try {
        const detail = await getPlaceDetail(item.googlePlaceId);
        const firstPhoto = detail.photoNames[0];
        const place: PlanPlace = {
          id: `item-${item.itemId}`,
          itemId: item.itemId,
          googlePlaceId: item.googlePlaceId,
          title: detail.name,
          subtitle: detail.formattedAddress,
          photoName: firstPhoto?.trim() || undefined,
          startTime: item.startTime,
          durationMinutes: item.durationMinutes,
          travelMode: item.travelMode,
        };
        return place;
      } catch {
        const place: PlanPlace = {
          id: `item-${item.itemId}`,
          itemId: item.itemId,
          googlePlaceId: item.googlePlaceId,
          title: "장소 정보를 불러올 수 없음",
          subtitle: item.googlePlaceId,
          startTime: item.startTime,
          durationMinutes: item.durationMinutes,
          travelMode: item.travelMode,
        };
        return place;
      }
    }),
  );
}
