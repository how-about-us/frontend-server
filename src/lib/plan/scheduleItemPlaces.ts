import { getScheduleItems } from "@/lib/api/rooms/schedule-items";
import { getPlaceDetail, getPlacePhotoUrl } from "@/lib/api/places";
import type { PlanPlace } from "@/lib/plan/types";

/** 새 항목 POST 시 `startTime` — `HH:mm` (로컬 슬롯: 08:00부터 번호당 1시간, 최대 22:00) */
export function slotStartTimeHm(itemIndex: number): string {
  const hour = Math.min(8 + itemIndex, 22);
  return `${String(hour).padStart(2, "0")}:00`;
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
        let imageUrl: string | undefined;
        const firstPhoto = detail.photoNames[0];
        if (firstPhoto) {
          try {
            imageUrl = await getPlacePhotoUrl(firstPhoto);
          } catch {
            /* 사진 없어도 카드는 표시 */
          }
        }
        const place: PlanPlace = {
          id: `item-${item.itemId}`,
          itemId: item.itemId,
          googlePlaceId: item.googlePlaceId,
          title: detail.name,
          subtitle: detail.formattedAddress,
          imageUrl,
          startTime: item.startTime,
          durationMinutes: item.durationMinutes,
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
        };
        return place;
      }
    }),
  );
}
