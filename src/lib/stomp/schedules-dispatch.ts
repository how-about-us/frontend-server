import type { QueryClient } from "@tanstack/react-query";

import { fetchScheduleItemsAsPlanPlaces } from "@/lib/plan/scheduleItemPlaces";
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
import { roomSchedulesQueryKey } from "@/lib/queryKeys/roomSchedules";
import { scheduleItemsQueryKey } from "@/lib/queryKeys/scheduleItems";
import type { RoomScheduleChangedEvent } from "@/lib/stomp/schedule-events";
import { usePlanMapDirectionsEpochStore } from "@/stores/plan-map-directions-epoch-store";

function removeRouteQueriesForSchedule(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
): void {
  queryClient.removeQueries({
    predicate: (q) => {
      const key = q.queryKey;
      if (!Array.isArray(key) || key[0] !== "schedule-item-route") {
        return false;
      }
      if (String(key[1] ?? "").trim() !== roomId) return false;
      return key[2] === scheduleId;
    },
  });
}

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
 * — `room-schedules`: 일차(스케줄) 목록(타 클라이언트·STOMP 유실 시에만 refetch; 액터는 POST로 이미 머지된 경우 생략)
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
      if (!alreadyHas) {
        await queryClient.invalidateQueries({
          queryKey: roomSchedulesQueryKey(rid),
          refetchType: "active",
        });
      }
      return;
    }

    case "SCHEDULE_DELETED":
      removeRouteQueriesForSchedule(queryClient, rid, sid);
      queryClient.removeQueries({
        queryKey: scheduleItemsQueryKey(rid, sid),
      });
      await queryClient.invalidateQueries({
        queryKey: roomSchedulesQueryKey(rid),
        refetchType: "active",
      });
      return;

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

    case "SCHEDULE_ITEM_UPDATED":
      await queryClient.invalidateQueries({
        queryKey: scheduleItemsQueryKey(rid, sid),
        refetchType: "active",
      });
      return;
  }
}
