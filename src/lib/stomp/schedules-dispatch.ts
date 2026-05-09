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
import {
  consumePendingScheduleDeleteEcho,
} from "@/lib/stomp/scheduleDeleteEcho";
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

/**
 * Plan 화면 등이 쓰는 캐시만, 스키마의 `type`별로 갱신합니다.
 * — `room-schedules` CREATE: 다른 클라이언트만 무효화(GET); 액터는 POST `onSuccess` 머지로 레이스 방지
 * — `SCHEDULE_DELETED`: 삭제 일차의 route·items 캐시 제거 후 이 탭 에코면 `room-schedules` 무효화·GET /rooms 생략, 다른 탭은 무효화·동기화 유지
 * — 일정 생성 시 `schedule-items`: 빈 일차는 `[]`로 시드해 불필요한 GET 방지
 * — `schedule-items`: 그 외 일차별 장소 목록
 * — `schedule-item-route`: `itemId`·인접 구간의 `segmentSourceItemId`만 무효화(폴백 시 일정 전체)
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
      const me = useSessionStore.getState().user?.id;
      const echoedFromThisTab =
        typeof me === "number" &&
        Number.isFinite(me) &&
        me === event.actorUserId &&
        consumePendingScheduleDeleteEcho(rid, sid);

      if (!echoedFromThisTab) {
        await queryClient.invalidateQueries({
          queryKey: roomSchedulesQueryKey(rid),
          refetchType: "active",
        });
        await syncRoomDetailFromServer(queryClient, rid);
      }
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
      await queryClient.invalidateQueries({
        queryKey: scheduleItemsQueryKey(rid, sid),
        refetchType: "active",
      });
      await refetchScheduleItemsPlaces(queryClient, rid, sid);
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
      const items = await getScheduleItems(rid, sid);
      await mergeOrRefetchSchedulePlanPlacesFromItems(
        queryClient,
        rid,
        sid,
        items,
      );
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
      if (useFallback) {
        await invalidateScheduleItemRouteForWholeSchedule(queryClient, rid, sid);
        epochStore.bumpForDirections(rid);
      } else {
        await invalidateScheduleItemRouteForSources(queryClient, rid, sid, sources);
        bumpMapForRouteSources(rid, sid, sources);
      }
      return;
    }

    case "SCHEDULE_ITEM_UPDATED": {
      const itemId = event.itemId;
      if (typeof itemId !== "number" || !Number.isFinite(itemId)) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: scheduleItemsQueryKey(rid, sid),
        refetchType: "active",
      });
      await refetchScheduleItemsPlaces(queryClient, rid, sid);

      const newIds = readOrderedItemIdsFromScheduleItemsCache(
        queryClient,
        rid,
        sid,
      );
      const { sources, useFallback } = collectSegmentSourcesForCreate(
        newIds,
        itemId,
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
  }
}
