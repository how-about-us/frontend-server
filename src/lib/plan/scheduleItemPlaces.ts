import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  getScheduleItems,
  updateScheduleItem,
  type RoomScheduleItem,
} from "@/lib/api/rooms/schedule-items";
import { fetchPlaceDetail } from "@/lib/places/place-queries";
import { scheduleItemsQueryKey } from "@/lib/query-keys";
import { addMinutesToHm, hmToMinutesSinceMidnight, minutesSinceMidnightToHm, normalizeStartTimeToHm } from "@/lib/plan/scheduleTime";
import type { PlanPlace } from "@/lib/plan/types";

/** `orderIndex` 기준 정렬(비변형) */
export function sortRoomScheduleItemsByOrder(
  items: RoomScheduleItem[],
): RoomScheduleItem[] {
  return [...items].sort((a, b) => a.orderIndex - b.orderIndex);
}

function memoFromScheduleItem(item: RoomScheduleItem): string | undefined {
  const raw = item.memo;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

type ApplyScheduleItemPatchOptions = {
  /** PATCH body에 `memo`가 포함된 경우 — 응답에서 필드가 생략돼도 삭제 반영 */
  memoTouched?: boolean;
};

/** PATCH 응답 — `memo` 키가 없으면 기존 캐시 메모 유지(시간만 수정 등) */
function memoFromScheduleItemPatch(
  existing: PlanPlace,
  updated: RoomScheduleItem,
  options?: ApplyScheduleItemPatchOptions,
): string | undefined {
  if (options?.memoTouched) {
    return memoFromScheduleItem(updated);
  }
  if (!Object.prototype.hasOwnProperty.call(updated, "memo")) {
    return existing.memo;
  }
  return memoFromScheduleItem(updated);
}

/**
 * 리오더 등으로 서버 `RoomScheduleItem[]`만 바뀐 경우, 캐시된 PlanPlace의
 * 제목·photoName·location 등은 유지하고 순서·시간·수단만 반영합니다.
 * 캐시에 없는 itemId가 있거나 집합/길이가 맞지 않으면 null → 전체 재조회.
 */
function mergeScheduleItemsIntoPlanPlaces(
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
    const hasServerStart =
      typeof item.startTime === "string" && item.startTime.trim().length > 0;
    const serverDurationOk =
      typeof item.durationMinutes === "number" &&
      Number.isFinite(item.durationMinutes);
    out.push({
      ...existing,
      googlePlaceId: item.googlePlaceId,
      startTime: hasServerStart ? item.startTime : existing.startTime,
      durationMinutes: serverDurationOk ? item.durationMinutes : existing.durationMinutes,
      travelMode: item.travelMode,
      memo: memoFromScheduleItem(item),
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

/** 일차 항목들 중 유효한 시작 시각이 가장 이른 `HH:mm` — 리오더 시 1번 칸 기준이 뒷줄로 밀려 올라가지 않도록 앵커로 씁니다. */
function earliestAnchoredHmFromScheduleItems(items: RoomScheduleItem[]): string {
  let minM: number | null = null;
  for (const it of items) {
    const hm = normalizeStartTimeToHm(it.startTime ?? "");
    if (!hm) continue;
    const m = hmToMinutesSinceMidnight(hm);
    if (m === null) continue;
    if (minM === null || m < minM) minM = m;
  }
  if (minM === null) return slotStartTimeHm(0);
  return minutesSinceMidnightToHm(minM);
}

/**
 * 리오더 후 이전 항목 `시작 + 체류`로 시작 시각을 이어 붙입니다.
 * 1번 칸 시작은 현재 목록 안에서 **가장 이른 시작 시각**(앵커)으로 고정해, 순서 변경만 할 때 기준이 늘지 않습니다.
 */
export function buildChainedStartPatchesForReorder(
  items: RoomScheduleItem[],
): Array<{ itemId: number; startTime: string; durationMinutes: number }> {
  const sorted = sortRoomScheduleItemsByOrder(items);
  if (sorted.length === 0) return [];

  const anchorHm = earliestAnchoredHmFromScheduleItems(sorted);

  const patches: Array<{
    itemId: number;
    startTime: string;
    durationMinutes: number;
  }> = [];

  let prevStartHm = anchorHm;
  let prevDur =
    typeof sorted[0].durationMinutes === "number" &&
    Number.isFinite(sorted[0].durationMinutes) ?
      sorted[0].durationMinutes
    : 0;

  for (let i = 0; i < sorted.length; i++) {
    const item = sorted[i];
    const dur =
      typeof item.durationMinutes === "number" &&
      Number.isFinite(item.durationMinutes) ?
        item.durationMinutes
      : 0;

    const targetHm =
      i === 0 ? anchorHm : addMinutesToHm(prevStartHm, prevDur);

    const currentHm = normalizeStartTimeToHm(item.startTime);
    if (currentHm !== targetHm) {
      patches.push({
        itemId: item.itemId,
        startTime: targetHm,
        durationMinutes: dur,
      });
    }

    prevStartHm = targetHm;
    prevDur = dur;
  }

  return patches;
}

/**
 * 리오더 API 성공 직후: 순서를 캐시에 반영한 뒤, 필요하면 시작 시각 연쇄 PATCH 후 최종 머지.
 */
export async function syncPlanPlacesAfterReorderSuccess(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
  items: RoomScheduleItem[],
): Promise<void> {
  const rid = roomId.trim();
  if (!rid.length) return;

  await mergeOrRefetchSchedulePlanPlacesFromItems(
    queryClient,
    roomId,
    scheduleId,
    items,
  );

  const patches = buildChainedStartPatchesForReorder(items);
  if (patches.length === 0) return;

  const snapshot = sortRoomScheduleItemsByOrder(items);
  const byItemId = new Map(snapshot.map((it) => [it.itemId, it]));

  try {
    for (const p of patches) {
      const updated = await updateScheduleItem(rid, scheduleId, p.itemId, {
        startTime: p.startTime,
        durationMinutes: p.durationMinutes,
      });
      byItemId.set(updated.itemId, updated);
    }
  } catch {
    toast.error("순서에 맞게 시작 시간을 바꾸지 못했어요.");
    try {
      const fresh = await getScheduleItems(rid, scheduleId);
      await mergeOrRefetchSchedulePlanPlacesFromItems(
        queryClient,
        roomId,
        scheduleId,
        fresh,
      );
    } catch {
      //
    }
    return;
  }

  await mergeOrRefetchSchedulePlanPlacesFromItems(
    queryClient,
    roomId,
    scheduleId,
    sortRoomScheduleItemsByOrder([...byItemId.values()]),
  );
}

/** 화면 순서 유지 `PlanPlace[]` 기준: 마지막 카드 시작 + 1시간, 없으면 슬롯 폴백. */
export function defaultNewItemStartTimeHmFromPlanPlaces(
  places: PlanPlace[],
): string {
  if (places.length === 0) return slotStartTimeHm(0);
  const last = places[places.length - 1];
  const hm = normalizeStartTimeToHm(last.startTime ?? "");
  if (!hm) return slotStartTimeHm(places.length);
  return addMinutesToHm(hm, 60);
}

/** `orderIndex` 정렬된 항목 목록 기준: 마지막 카드 시작 + 1시간. */
export function defaultNewItemStartTimeHmFromScheduleItems(
  items: RoomScheduleItem[],
): string {
  const sorted = sortRoomScheduleItemsByOrder(items);
  if (sorted.length === 0) return slotStartTimeHm(0);
  const last = sorted[sorted.length - 1];
  const hm = normalizeStartTimeToHm(last.startTime);
  if (!hm) return slotStartTimeHm(sorted.length);
  return addMinutesToHm(hm, 60);
}

/** PATCH 응답 한 건으로 로컬 PlanPlace 캐시만 갱신(같은 목록에 itemId가 있을 때). */
export function applyRoomScheduleItemToPlanPlaces(
  prev: PlanPlace[] | undefined,
  updated: RoomScheduleItem,
  options?: ApplyScheduleItemPatchOptions,
): PlanPlace[] | null {
  if (!prev || prev.length === 0) return null;
  let found = false;
  const out = prev.map((p) => {
    if (p.itemId !== updated.itemId) return p;
    found = true;
    const hasServerStart =
      typeof updated.startTime === "string" &&
      updated.startTime.trim().length > 0;
    const serverDurationOk =
      typeof updated.durationMinutes === "number" &&
      Number.isFinite(updated.durationMinutes);
    return {
      ...p,
      googlePlaceId: updated.googlePlaceId,
      startTime: hasServerStart ? updated.startTime : p.startTime,
      durationMinutes: serverDurationOk
        ? updated.durationMinutes
        : p.durationMinutes,
      travelMode: updated.travelMode,
      memo: memoFromScheduleItemPatch(p, updated, options),
    };
  });
  return found ? out : null;
}

async function planPlaceFromScheduleItem(
  item: RoomScheduleItem,
): Promise<PlanPlace> {
  try {
    const detail = await fetchPlaceDetail(item.googlePlaceId);
    const firstPhoto = detail.photoNames[0];
    return {
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
      memo: memoFromScheduleItem(item),
    };
  } catch {
    return {
      id: `item-${item.itemId}`,
      itemId: item.itemId,
      googlePlaceId: item.googlePlaceId,
      title: "장소 정보를 불러올 수 없음",
      subtitle: item.googlePlaceId,
      startTime: item.startTime,
      durationMinutes: item.durationMinutes,
      travelMode: item.travelMode,
      memo: memoFromScheduleItem(item),
    };
  }
}

/** POST 응답으로 `schedule-items` 캐시에 새 항목을 반영합니다(GET items 생략). */
export async function appendCreatedScheduleItemToPlanPlaces(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
  created: RoomScheduleItem,
): Promise<void> {
  const rid = roomId.trim();
  if (!rid.length) return;
  const key = scheduleItemsQueryKey(rid, scheduleId);
  const prev = queryClient.getQueryData<PlanPlace[]>(key) ?? [];
  if (prev.some((p) => p.itemId === created.itemId)) return;

  const newPlace = await planPlaceFromScheduleItem(created);
  const without = prev.filter((p) => p.itemId !== created.itemId);
  const idx = Math.max(0, Math.min(created.orderIndex, without.length));
  const next = [...without];
  next.splice(idx, 0, newPlace);
  queryClient.setQueryData(key, next);
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
  return Promise.all(sorted.map((item) => planPlaceFromScheduleItem(item)));
}
