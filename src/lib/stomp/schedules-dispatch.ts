import type { QueryClient } from "@tanstack/react-query";

import {
  fetchScheduleItemsAsPlanPlaces,
  mergeOrRefetchSchedulePlanPlacesFromItems,
} from "@/lib/plan/scheduleItemPlaces";
import { getScheduleItems } from "@/lib/api/rooms/schedule-items";
import {
  collectSegmentSourcesForCreate,
  collectSegmentSourcesForDelete,
  collectSegmentSourcesForReorder,
  invalidateScheduleItemRouteForSources,
  invalidateScheduleItemRouteForWholeSchedule,
  readOrderedItemIdsFromScheduleItemsCache,
} from "@/lib/plan/scheduleStompRouteScope";
import type { RoomSchedule } from "@/lib/api/rooms";
import type { PlanPlace } from "@/lib/plan/types";
import { roomSchedulesQueryKey, scheduleItemsQueryKey } from "@/lib/query-keys";
import {
  removeCachesForDeletedSchedule,
  syncRoomDetailFromServer,
} from "@/lib/rooms";
import type { RoomScheduleChangedEvent } from "@/lib/stomp/schedule-events";
import { useSessionStore } from "@/stores/session-store";
import { usePlanMapDirectionsEpochStore } from "@/stores/plan-map-directions-epoch-store";

function removeRouteQueriesForDeletedItemSource(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
  itemId: number,
): void {
  queryClient.removeQueries({
    predicate: (q) => {
      const key = q.queryKey;
      if (!Array.isArray(key) || key[0] !== "schedule-item-route") {
        return false;
      }
      if (String(key[1] ?? "").trim() !== roomId) return false;
      if (key[2] !== scheduleId) return false;
      return key[3] === itemId;
    },
  });
}

async function refetchScheduleItemsPlaces(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
): Promise<void> {
  await queryClient.fetchQuery({
    queryKey: scheduleItemsQueryKey(roomId, scheduleId),
    queryFn: () => fetchScheduleItemsAsPlanPlaces(roomId, scheduleId),
  });
}

function bumpMapForRouteSources(
  roomId: string,
  scheduleId: number,
  sourceItemIds: number[],
): void {
  if (sourceItemIds.length === 0) return;
  usePlanMapDirectionsEpochStore.getState().bumpSegments(
    roomId,
    sourceItemIds.map((segmentSourceItemId) => ({
      scheduleId,
      segmentSourceItemId,
    })),
  );
}

type DebouncedRouteInvBucket =
  | { scope: "whole" }
  | { scope: "sources"; ids: Set<number> };

/** 리오더 시 같은 구간 무효화를 짧게 묶어 `/route` 이중 패치를 줄임 */
const scheduleRouteInvalidateDebounceTimers = new Map<
  string,
  ReturnType<typeof setTimeout>
>();
const scheduleRouteInvalidatePending = new Map<string, DebouncedRouteInvBucket>();
const DEBOUNCE_SCHEDULE_ROUTE_INVALIDATE_MS = 100;

function mergeRouteInvalidateBucket(
  prev: DebouncedRouteInvBucket | undefined,
  sourcesToAdd: number[],
  forceWholeSchedule: boolean,
): DebouncedRouteInvBucket {
  if (forceWholeSchedule || prev?.scope === "whole") {
    return { scope: "whole" };
  }
  const ids =
    prev?.scope === "sources" ? prev.ids : new Set<number>();
  for (const id of sourcesToAdd) {
    ids.add(id);
  }
  return { scope: "sources", ids };
}

function enqueueDebouncedInvalidateScheduleRoutes(
  queryClient: QueryClient,
  rid: string,
  sid: number,
  sourcesForInvalidation: number[],
  forceWholeSchedule: boolean,
): void {
  const mapKey = `${rid}:${sid}`;
  scheduleRouteInvalidatePending.set(
    mapKey,
    mergeRouteInvalidateBucket(
      scheduleRouteInvalidatePending.get(mapKey),
      sourcesForInvalidation,
      forceWholeSchedule,
    ),
  );
  const existing = scheduleRouteInvalidateDebounceTimers.get(mapKey);
  if (existing !== undefined) clearTimeout(existing);

  scheduleRouteInvalidateDebounceTimers.set(
    mapKey,
    setTimeout(() => {
      scheduleRouteInvalidateDebounceTimers.delete(mapKey);
      const epochStore = usePlanMapDirectionsEpochStore.getState();
      const bucket = scheduleRouteInvalidatePending.get(mapKey);
      scheduleRouteInvalidatePending.delete(mapKey);
      if (!bucket) return;
      void (async () => {
        if (bucket.scope === "whole") {
          await invalidateScheduleItemRouteForWholeSchedule(
            queryClient,
            rid,
            sid,
          );
          epochStore.bumpForDirections(rid);
        } else if (bucket.ids.size > 0) {
          const sources = [...bucket.ids];
          await invalidateScheduleItemRouteForSources(
            queryClient,
            rid,
            sid,
            sources,
          );
          bumpMapForRouteSources(rid, sid, sources);
        }
      })();
    }, DEBOUNCE_SCHEDULE_ROUTE_INVALIDATE_MS),
  );
}

/** 연속 일정 항목 동기화(GET items)를 한 번으로 묶음 — `SCHEDULE_ITEM_UPDATED`(원격) 전용 */
const syncSchedulePlacesFromItemsDebouncers = new Map<
  string,
  ReturnType<typeof setTimeout>
>();
const DEBOUNCE_ITEMS_GET_MS = 90;

function enqueueDebouncedHydratePlacesFromScheduleItemsApi(
  queryClient: QueryClient,
  rid: string,
  sid: number,
): void {
  const mapKey = `${rid}:${sid}`;
  const pending = syncSchedulePlacesFromItemsDebouncers.get(mapKey);
  if (pending !== undefined) clearTimeout(pending);
  syncSchedulePlacesFromItemsDebouncers.set(
    mapKey,
    setTimeout(() => {
      syncSchedulePlacesFromItemsDebouncers.delete(mapKey);
      void (async () => {
        try {
          const rows = await getScheduleItems(rid, sid);
          await mergeOrRefetchSchedulePlanPlacesFromItems(
            queryClient,
            rid,
            sid,
            rows,
          );
        } catch {
          //
        }
      })();
    }, DEBOUNCE_ITEMS_GET_MS),
  );
}

/**
 * Plan 화면 등이 쓰는 캐시만, 스키마의 `type`별로 갱신합니다.
 * — `room-schedules` CREATE: 다른 클라이언트만 무효화(GET); 액터는 POST `onSuccess` 머지로 레이스 방지
 * — `SCHEDULE_DELETED`: 삭제 일차의 route·items 캐시 제거 후 `room-schedules` 무효화 및 방 상세 동기화(발신 탭 포함 동일)
 * — 일정 생성 시 `schedule-items`: 빈 일차는 `[]`로 시드해 불필요한 GET 방지
 * — `schedule-items`: 그 외 일차별 장소 목록
 * — `schedule-item-route`: `itemId`·인접 구간의 `segmentSourceItemId`만 무효화(폴백 시 일정 전체)
 * — `SCHEDULE_ITEM_UPDATED`: 일정 목록만 동기화할 때 사용(원격 탭); 경로(`schedule-item-route`)는 무효화하지 않음
 * — 맵 polyline: 구간별 에폭(`bumpSegments`); 폴백 시 방 단위(`bumpForDirections`)
 */
export async function dispatchRoomScheduleEvent(
  queryClient: QueryClient,
  event: RoomScheduleChangedEvent,
): Promise<void> {
  const rid = String(event.roomId ?? "").trim();
  if (!rid) return;
  const sid = event.scheduleId;
  const epochStore = usePlanMapDirectionsEpochStore.getState();

  switch (event.type) {
    case "SCHEDULE_CREATED": {
      queryClient.setQueryData<PlanPlace[]>(
        scheduleItemsQueryKey(rid, sid),
        [],
      );
      const existing = queryClient.getQueryData<RoomSchedule[]>(
        roomSchedulesQueryKey(rid),
      );
      const alreadyHas = existing?.some((s) => s.scheduleId === sid) ?? false;
      const me = useSessionStore.getState().user?.id;
      const isScheduleCreateActor =
        typeof me === "number" &&
        Number.isFinite(me) &&
        me === event.actorUserId;

      if (!alreadyHas && !isScheduleCreateActor) {
        await queryClient.invalidateQueries({
          queryKey: roomSchedulesQueryKey(rid),
          refetchType: "active",
        });
      }
      await syncRoomDetailFromServer(queryClient, rid);
      return;
    }

    case "SCHEDULE_DELETED": {
      removeCachesForDeletedSchedule(queryClient, rid, sid);
      await queryClient.invalidateQueries({
        queryKey: roomSchedulesQueryKey(rid),
        refetchType: "active",
      });
      await syncRoomDetailFromServer(queryClient, rid);
      return;
    }

    case "SCHEDULE_ITEM_DELETED": {
      const oldIds = readOrderedItemIdsFromScheduleItemsCache(
        queryClient,
        rid,
        sid,
      );
      removeRouteQueriesForDeletedItemSource(queryClient, rid, sid, event.itemId);
      await queryClient.invalidateQueries({
        queryKey: scheduleItemsQueryKey(rid, sid),
        refetchType: "active",
      });
      await refetchScheduleItemsPlaces(queryClient, rid, sid);

      const { sources, useFallback } = collectSegmentSourcesForDelete(
        oldIds,
        event.itemId,
      );
      if (useFallback) {
        await invalidateScheduleItemRouteForWholeSchedule(queryClient, rid, sid);
        epochStore.bumpForDirections(rid);
      } else {
        await invalidateScheduleItemRouteForSources(queryClient, rid, sid, sources);
        bumpMapForRouteSources(rid, sid, sources);
      }
      return;
    }

    case "SCHEDULE_ITEM_CREATED": {
      const me = useSessionStore.getState().user?.id;
      const actorIsMe =
        typeof me === "number" &&
        Number.isFinite(me) &&
        me === event.actorUserId;
      const cachedIds = readOrderedItemIdsFromScheduleItemsCache(
        queryClient,
        rid,
        sid,
      );
      const cacheHasNewItem = cachedIds?.includes(event.itemId) ?? false;

      if (!actorIsMe || !cacheHasNewItem) {
        await refetchScheduleItemsPlaces(queryClient, rid, sid);
      }

      const newIds = readOrderedItemIdsFromScheduleItemsCache(
        queryClient,
        rid,
        sid,
      );
      const { sources, useFallback } = collectSegmentSourcesForCreate(
        newIds,
        event.itemId,
      );
      if (useFallback) {
        await invalidateScheduleItemRouteForWholeSchedule(queryClient, rid, sid);
        epochStore.bumpForDirections(rid);
      } else {
        await invalidateScheduleItemRouteForSources(queryClient, rid, sid, sources);
        bumpMapForRouteSources(rid, sid, sources);
      }
      return;
    }

    case "SCHEDULE_ITEMS_REORDERED": {
      const oldIds = readOrderedItemIdsFromScheduleItemsCache(
        queryClient,
        rid,
        sid,
      );
      const me = useSessionStore.getState().user?.id;
      const hydrateFromApi =
        !(
          typeof me === "number" &&
          Number.isFinite(me) &&
          event.actorUserId === me
        );

      if (hydrateFromApi) {
        const items = await getScheduleItems(rid, sid);
        await mergeOrRefetchSchedulePlanPlacesFromItems(
          queryClient,
          rid,
          sid,
          items,
        );
      }
      const newIds = readOrderedItemIdsFromScheduleItemsCache(
        queryClient,
        rid,
        sid,
      );
      const { sources, useFallback } = collectSegmentSourcesForReorder(
        oldIds,
        newIds,
        event.itemId,
      );
      enqueueDebouncedInvalidateScheduleRoutes(
        queryClient,
        rid,
        sid,
        useFallback ? [] : sources,
        useFallback,
      );
      return;
    }

    case "SCHEDULE_ITEM_UPDATED": {
      const itemId = event.itemId;
      if (typeof itemId !== "number" || !Number.isFinite(itemId)) {
        return;
      }

      const me = useSessionStore.getState().user?.id;
      const actorIsMe =
        typeof me === "number" &&
        Number.isFinite(me) &&
        event.actorUserId === me;

      if (actorIsMe) {
        return;
      }

      enqueueDebouncedHydratePlacesFromScheduleItemsApi(queryClient, rid, sid);
      return;
    }
  }
}
