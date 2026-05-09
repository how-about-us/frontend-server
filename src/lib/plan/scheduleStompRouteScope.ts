import type { QueryClient } from "@tanstack/react-query";

import { clearPersistedScheduleRoutesForSchedule } from "@/lib/plan/planTravelLocalStorage";
import type { PlanPlace } from "@/lib/plan/types";
import { scheduleItemsQueryKey } from "@/lib/query-keys";

function asOrderedItemIds(places: unknown): number[] | null {
  if (!Array.isArray(places)) return null;
  const out: number[] = [];
  for (const p of places) {
    const row = p as PlanPlace;
    if (typeof row?.itemId === "number" && Number.isFinite(row.itemId)) {
      out.push(row.itemId);
    }
  }
  return out.length > 0 || places.length === 0 ? out : null;
}

/** `schedule-items` 캐시의 `PlanPlace[]`에서 순서대로 `itemId`를 뽑습니다. */
export function readOrderedItemIdsFromScheduleItemsCache(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
): number[] | null {
  const data = queryClient.getQueryData<PlanPlace[]>(
    scheduleItemsQueryKey(roomId, scheduleId),
  );
  return asOrderedItemIds(data ?? null);
}

/** 항목 `itemId`에 인접한 구간의 출발 `segmentSourceItemId` (최대 prev, 자신). */
function segmentSourcesTouchingItem(
  orderedItemIds: number[],
  itemId: number,
): Set<number> {
  const s = new Set<number>();
  const i = orderedItemIds.indexOf(itemId);
  if (i < 0) return s;
  if (i > 0) s.add(orderedItemIds[i - 1]!);
  if (i < orderedItemIds.length - 1) s.add(orderedItemIds[i]!);
  return s;
}

export function collectSegmentSourcesForCreate(
  newOrderedIds: number[] | null,
  itemId: number,
): { sources: number[]; useFallback: boolean } {
  if (!newOrderedIds?.length) {
    return { sources: [], useFallback: true };
  }
  if (newOrderedIds.indexOf(itemId) < 0) {
    return { sources: [], useFallback: true };
  }
  return {
    sources: [...segmentSourcesTouchingItem(newOrderedIds, itemId)],
    useFallback: false,
  };
}

export function collectSegmentSourcesForDelete(
  oldOrderedIds: number[] | null,
  deletedItemId: number,
): { sources: number[]; useFallback: boolean } {
  if (!oldOrderedIds?.length) {
    return { sources: [], useFallback: true };
  }
  const i = oldOrderedIds.indexOf(deletedItemId);
  if (i < 0) {
    return { sources: [], useFallback: true };
  }
  if (i === 0) {
    return { sources: [], useFallback: false };
  }
  return { sources: [oldOrderedIds[i - 1]!], useFallback: false };
}

export function collectSegmentSourcesForReorder(
  oldOrderedIds: number[] | null,
  newOrderedIds: number[] | null,
  itemId: number,
): { sources: number[]; useFallback: boolean } {
  if (!newOrderedIds?.length) {
    return { sources: [], useFallback: true };
  }
  if (newOrderedIds.indexOf(itemId) < 0) {
    return { sources: [], useFallback: true };
  }
  const s = new Set(segmentSourcesTouchingItem(newOrderedIds, itemId));
  if (oldOrderedIds?.length) {
    segmentSourcesTouchingItem(oldOrderedIds, itemId).forEach((id) =>
      s.add(id),
    );
  }
  return { sources: [...s], useFallback: false };
}

export async function invalidateScheduleItemRouteForSources(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
  sourceItemIds: number[],
): Promise<void> {
  if (sourceItemIds.length === 0) return;
  const rid = roomId.trim();
  clearPersistedScheduleRoutesForSchedule(rid, scheduleId);
  const want = new Set(sourceItemIds);
  await queryClient.invalidateQueries({
    predicate: (q) => {
      const key = q.queryKey;
      if (!Array.isArray(key) || key[0] !== "schedule-item-route") {
        return false;
      }
      if (String(key[1] ?? "").trim() !== rid) return false;
      if (key[2] !== scheduleId) return false;
      return typeof key[3] === "number" && want.has(key[3]);
    },
    /** `all`이면 옵저버 없는 캐시(재정렬로 구간이 사라진 뒤)도 refetch되어 모드 4개가 동시에 나감 */
    refetchType: "active",
  });
}

export async function invalidateScheduleItemRouteForWholeSchedule(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
): Promise<void> {
  const rid = roomId.trim();
  clearPersistedScheduleRoutesForSchedule(rid, scheduleId);
  await queryClient.invalidateQueries({
    predicate: (q) => {
      const key = q.queryKey;
      if (!Array.isArray(key) || key[0] !== "schedule-item-route") {
        return false;
      }
      if (String(key[1] ?? "").trim() !== rid) return false;
      return key[2] === scheduleId;
    },
    refetchType: "active",
  });
}
