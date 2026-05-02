import { getScheduleItems } from "@/lib/api/rooms/schedule-items";
import { getPlaceDetail, getPlacePhotoUrl } from "@/lib/api/places";
import type { PlanPlace } from "@/mocks/plan";

import { parseLocalYmd } from "@/lib/plan/tripRange";

/** 새 항목 POST 시 `startTime` — 해당 일정 날짜 로컬 자정 기준 슬롯 시각 */
export function isoStartForNewScheduleItem(
  dateYmd: string,
  itemIndex: number,
): string {
  const d = parseLocalYmd(dateYmd);
  const hour = Math.min(8 + itemIndex, 22);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
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
        };
        return place;
      } catch {
        const place: PlanPlace = {
          id: `item-${item.itemId}`,
          itemId: item.itemId,
          googlePlaceId: item.googlePlaceId,
          title: "장소 정보를 불러올 수 없음",
          subtitle: item.googlePlaceId,
        };
        return place;
      }
    }),
  );
}
