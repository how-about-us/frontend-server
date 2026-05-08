import type { QueryClient } from "@tanstack/react-query";

import { getPlaceDetail } from "@/lib/api/places";
import {
  getScheduleItems,
  type RoomScheduleItem,
} from "@/lib/api/rooms/schedule-items";
import { scheduleItemsQueryKey } from "@/lib/queryKeys/scheduleItems";
import type { PlanPlace } from "@/lib/plan/types";

/** `orderIndex` 기준 정렬(비변형) */
export function sortRoomScheduleItemsByOrder(
  items: RoomScheduleItem[],
): RoomScheduleItem[] {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * 리오더 등으로 서버 `RoomScheduleItem[]`만 바뀐 경우, 캐시된 PlanPlace의
 * 제목·photoName·location 등은 유지하고 순서·시간·수단만 반영합니다.
 * 캐시에 없는 itemId가 있거나 집합/길이가 맞지 않으면 null → 전체 재조회.
 */
export function mergeScheduleItemsIntoPlanPlaces(
  prev: PlanPlace[] | undefined,
  items: RoomScheduleItem[],
): PlanPlace[] | null {
  if (!prev || prev.length === 0) return null;

  const prevWithId = prev.filter(
    (p): p is PlanPlace & { itemId: number } => typeof p.itemId === "number",
  );
  if (prevWithId.length !== prev.length) return null;
  if (items.length !== prev.length) return null;

  const byId = new Map<number, PlanPlace>();
  for (const p of prevWithId) {
    byId.set(p.itemId, p);
  }
  if (byId.size !== prevWithId.length) return null;

  const sorted = sortRoomScheduleItemsByOrder(items);
  const out: PlanPlace[] = [];
  for (const item of sorted) {
    const existing = byId.get(item.itemId);
    if (!existing) return null;
    out.push({
      ...existing,
      googlePlaceId: item.googlePlaceId,
      startTime: item.startTime,
      durationMinutes: item.durationMinutes,
      travelMode: item.travelMode,
    });
  }
  return out;
}

/**
 * STOMP 리오더·`reorderScheduleItem` 응답 등 공통 경로: `RoomScheduleItem[]`로
 * 캐시된 PlanPlace를 갱신하고, 머지 불가 시에만 전체 enrich를 다시 가져옵니다.
 */
export async function mergeOrRefetchSchedulePlanPlacesFromItems(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
  items: RoomScheduleItem[],
): Promise<void> {
  const rid = roomId.trim();
  if (!rid.length) return;
  const key = scheduleItemsQueryKey(rid, scheduleId);
  const prev = queryClient.getQueryData<PlanPlace[]>(key);
  const merged = mergeScheduleItemsIntoPlanPlaces(prev, items);
  if (merged) {
    queryClient.setQueryData(key, merged);
    return;
  }
  await queryClient.fetchQuery({
    queryKey: key,
    queryFn: () => fetchScheduleItemsAsPlanPlaces(rid, scheduleId),
  });
}

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
  const sorted = sortRoomScheduleItemsByOrder(items);
  return Promise.all(
    sorted.map(async (item) => {
      try {
        const detail = await getPlaceDetail(item.googlePlaceId);
        const firstPhoto = detail.photoNames[0];
        const place: PlanPlace = {
          id: `item-${item.itemId}`,
          itemId: item.itemId,
          googlePlaceId: item.googlePlaceId,
          location: detail.location,
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
