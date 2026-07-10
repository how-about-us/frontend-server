import type { QueryClient } from "@tanstack/react-query";

import type { RoomScheduleWithItems } from "@/lib/api/rooms/schedules";
import {
  getScheduleItemRoutesBatch,
  type RoomScheduleItem,
  type ScheduleItemRouteBatchItem,
} from "@/lib/api/rooms/schedule-items";
import { getRoomSchedules } from "@/lib/api/rooms/schedules";
import { isBatchItemOk } from "@/lib/api/batch-types";
import {
  fetchAndSeedPlacePhotoUrls,
  fetchAndSeedPlacePreviews,
} from "@/lib/places/place-batch-cache";
import type { PlacePreview } from "@/lib/api/places";
import {
  fetchPlacePreview,
  placePreviewQueryKey,
  resolvePreviewGooglePlaceId,
} from "@/lib/places/place-queries";
import { sortRoomSchedules } from "@/lib/plan/scheduleMerge";
import { SCHEDULE_ROUTE_PRIMARY_FETCH_MODE } from "@/lib/plan/scheduleTravelMode";
import type { PlanPlace } from "@/lib/plan/types";
import {
  roomSchedulesQueryKey,
  scheduleItemRouteQueryKey,
  scheduleItemsQueryKey,
} from "@/lib/query-keys";
import { awaitRoomSchedulesHydrated } from "@/lib/rooms";
import type { ScheduleTravelModeValue } from "@/lib/plan/scheduleTravelMode";

export const PLAN_PLACE_PREVIEW_ERROR_TITLE = "장소 정보를 불러올 수 없음";

export function planPlacesNeedPreviewEnrich(
  places: readonly PlanPlace[],
): boolean {
  return places.some((place) => place.title === PLAN_PLACE_PREVIEW_ERROR_TITLE);
}

/** `includeItems` hydrate 후 room-schedules 캐시에서 일차별 raw items를 읽습니다. */
export function readScheduleItemsFromRoomCache(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
): RoomScheduleItem[] | null {
  const rid = roomId.trim();
  if (!rid.length) return null;

  const schedules = queryClient.getQueryData<RoomScheduleWithItems[]>(
    roomSchedulesQueryKey(rid),
  );
  if (!schedules) return null;

  const schedule = schedules.find((s) => s.scheduleId === scheduleId);
  if (!schedule) return null;

  return Array.isArray(schedule.items) ? schedule.items : [];
}

/** room-schedules 캐시 miss 시 `includeItems` hydrate 후 items를 반환합니다. */
export async function resolveScheduleItemsFromCacheOrHydrate(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
): Promise<RoomScheduleItem[]> {
  const cached = readScheduleItemsFromRoomCache(
    queryClient,
    roomId,
    scheduleId,
  );
  if (cached !== null) return cached;

  await awaitRoomSchedulesHydrated(queryClient, roomId);
  return (
    readScheduleItemsFromRoomCache(queryClient, roomId, scheduleId) ?? []
  );
}

function sortRoomScheduleItemsByOrder(
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

function planPlaceFromItemAndPreview(
  item: RoomScheduleItem,
  preview: PlacePreview | null,
): PlanPlace {
  if (preview) {
    return {
      id: `item-${item.itemId}`,
      itemId: item.itemId,
      googlePlaceId: item.googlePlaceId,
      location: preview.location,
      title: preview.name,
      subtitle: preview.formattedAddress,
      photoName: preview.photoName,
      primaryTypeDisplayName: preview.primaryTypeDisplayName,
      startTime: item.startTime ?? undefined,
      durationMinutes: item.durationMinutes ?? undefined,
      travelMode: item.travelMode,
      memo: memoFromScheduleItem(item),
    };
  }
  return {
    id: `item-${item.itemId}`,
    itemId: item.itemId,
    googlePlaceId: item.googlePlaceId,
    title: PLAN_PLACE_PREVIEW_ERROR_TITLE,
    subtitle: item.googlePlaceId,
    startTime: item.startTime ?? undefined,
    durationMinutes: item.durationMinutes ?? undefined,
    travelMode: item.travelMode,
    memo: memoFromScheduleItem(item),
  };
}

function readCachedPreview(
  queryClient: QueryClient,
  googlePlaceId: string,
): PlacePreview | null {
  const id = resolvePreviewGooglePlaceId(googlePlaceId);
  if (!id.length) return null;
  const cached = queryClient.getQueryData<PlacePreview>(placePreviewQueryKey(id));
  return cached ?? null;
}

function buildPlanPlacesFromItemsWithCache(
  queryClient: QueryClient,
  items: RoomScheduleItem[],
): PlanPlace[] {
  const sorted = sortRoomScheduleItemsByOrder(items);
  return sorted.map((item) =>
    planPlaceFromItemAndPreview(
      item,
      readCachedPreview(queryClient, item.googlePlaceId),
    ),
  );
}

/** batch 시딩 후 preview 캐시 miss 항목만 GET `/preview`로 보강합니다. */
export async function buildPlanPlacesFromItemsWithPreviewEnrichment(
  queryClient: QueryClient,
  items: RoomScheduleItem[],
): Promise<PlanPlace[]> {
  const sorted = sortRoomScheduleItemsByOrder(items);
  const placeIds = sorted
    .map((item) => item.googlePlaceId)
    .filter((id) => typeof id === "string" && id.trim().length > 0);

  if (placeIds.length) {
    await fetchAndSeedPlacePreviews(placeIds, queryClient);
  }

  const out: PlanPlace[] = [];
  for (const item of sorted) {
    let preview = readCachedPreview(queryClient, item.googlePlaceId);
    if (!preview) {
      try {
        preview = await fetchPlacePreview(item.googlePlaceId);
      } catch {
        preview = null;
      }
    }
    out.push(planPlaceFromItemAndPreview(item, preview));
  }
  return out;
}

function collectGooglePlaceIdsFromSchedules(
  schedules: readonly RoomScheduleWithItems[],
): string[] {
  const ids = new Set<string>();
  for (const schedule of schedules) {
    for (const item of schedule.items ?? []) {
      const gid =
        typeof item.googlePlaceId === "string" ? item.googlePlaceId.trim() : "";
      if (gid.length) ids.add(gid);
    }
  }
  return [...ids];
}

function collectPhotoNamesFromPlanPlaces(places: readonly PlanPlace[]): string[] {
  const names = new Set<string>();
  for (const place of places) {
    const name =
      typeof place.photoName === "string" ? place.photoName.trim() : "";
    if (name.length) names.add(name);
  }
  return [...names];
}

export async function hydrateScheduleItemsFromSchedulesWithItems(
  queryClient: QueryClient,
  roomId: string,
  schedules: readonly RoomScheduleWithItems[],
): Promise<void> {
  const rid = roomId.trim();
  if (!rid.length) return;

  const placeIds = collectGooglePlaceIdsFromSchedules(schedules);
  if (placeIds.length) {
    await fetchAndSeedPlacePreviews(placeIds, queryClient);
  }

  const photoNames: string[] = [];

  for (const schedule of schedules) {
    const sid = schedule.scheduleId;
    if (typeof sid !== "number" || !Number.isFinite(sid)) continue;

    const items = Array.isArray(schedule.items) ? schedule.items : [];
    const places = await buildPlanPlacesFromItemsWithPreviewEnrichment(
      queryClient,
      items,
    );
    queryClient.setQueryData(scheduleItemsQueryKey(rid, sid), places);
    photoNames.push(...collectPhotoNamesFromPlanPlaces(places));
  }

  if (photoNames.length) {
    await fetchAndSeedPlacePhotoUrls(photoNames, queryClient);
  }
}

function batchRouteItemToResponse(
  item: ScheduleItemRouteBatchItem,
): import("@/lib/api/rooms/schedule-items").ScheduleItemRouteResponse | null {
  if (!isBatchItemOk(item)) return null;
  return {
    distanceMeters: item.distanceMeters,
    durationSeconds: item.durationSeconds,
    travelMode: item.travelMode,
  };
}

const inFlightDrivingRoutesBatch = new Map<string, Promise<void>>();

function drivingRoutesBatchKey(
  roomId: string,
  scheduleId: number,
  places: readonly PlanPlace[],
): string {
  const itemIds = places
    .slice(0, -1)
    .map((place) => place.itemId)
    .filter((id): id is number => typeof id === "number" && Number.isFinite(id))
    .join(",");
  return `${roomId.trim()}:${scheduleId}:${itemIds}`;
}

/** 일차 DRIVING 구간 경로를 batch로 시딩합니다 (in-flight dedup). */
export async function fetchAndSeedScheduleDrivingRoutes(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
  places: readonly PlanPlace[],
): Promise<void> {
  const rid = roomId.trim();
  if (!rid.length || places.length < 2) return;

  const key = drivingRoutesBatchKey(rid, scheduleId, places);
  const inFlight = inFlightDrivingRoutesBatch.get(key);
  if (inFlight) return inFlight;

  const promise = hydrateScheduleDrivingRoutes(
    queryClient,
    rid,
    scheduleId,
    places,
  ).finally(() => {
    inFlightDrivingRoutesBatch.delete(key);
  });

  inFlightDrivingRoutesBatch.set(key, promise);
  return promise;
}

/** prefetch 중인 DRIVING batch가 끝날 때까지 대기합니다. */
export async function awaitScheduleDrivingRoutesBatch(
  roomId: string,
  scheduleId: number,
): Promise<void> {
  const rid = roomId.trim();
  if (!rid.length) return;

  const prefix = `${rid}:${scheduleId}:`;
  const pending = [...inFlightDrivingRoutesBatch.entries()]
    .filter(([key]) => key.startsWith(prefix))
    .map(([, promise]) => promise);

  if (pending.length) {
    await Promise.all(pending);
  }
}

export async function hydrateScheduleDrivingRoutes(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
  places: readonly PlanPlace[],
  travelMode: ScheduleTravelModeValue = SCHEDULE_ROUTE_PRIMARY_FETCH_MODE,
): Promise<void> {
  const rid = roomId.trim();
  if (!rid.length || places.length < 2) return;

  const segments = places.slice(0, -1);
  const requestItems = segments
    .map((place) => place.itemId)
    .filter((id): id is number => typeof id === "number" && Number.isFinite(id))
    .map((itemId) => ({ itemId, travelMode }));

  if (!requestItems.length) return;

  const results = await getScheduleItemRoutesBatch(rid, scheduleId, requestItems);

  for (const result of results) {
    const route = batchRouteItemToResponse(result);
    const itemId = result.itemId;
    const mode =
      typeof result.travelMode === "string"
        ? (result.travelMode as ScheduleTravelModeValue)
        : travelMode;
    if (typeof itemId !== "number" || !Number.isFinite(itemId)) continue;

    queryClient.setQueryData(
      scheduleItemRouteQueryKey(rid, scheduleId, itemId, mode),
      route,
    );
  }
}

export async function hydrateRoomSchedulesWithItems(
  queryClient: QueryClient,
  roomId: string,
): Promise<RoomScheduleWithItems[]> {
  const rid = roomId.trim();
  if (!rid.length) return [];

  const schedules = await getRoomSchedules(rid, { includeItems: true });
  const sorted = sortRoomSchedules(schedules);
  await hydrateScheduleItemsFromSchedulesWithItems(queryClient, rid, sorted);
  return sorted;
}

export { buildPlanPlacesFromItemsWithCache, planPlaceFromItemAndPreview };
