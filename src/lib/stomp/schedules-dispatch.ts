import type { QueryClient } from "@tanstack/react-query";

import { roomSchedulesQueryKey } from "@/lib/queryKeys/roomSchedules";
import { scheduleItemsQueryKey } from "@/lib/queryKeys/scheduleItems";
import type { RoomScheduleChangedEvent } from "@/lib/stomp/schedule-events";

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

/**
 * Plan 화면 등이 쓰는 캐시만, 스키마의 `type`별로 갱신합니다.
 * — `room-schedules`: 일차(스케줄) 목록
 * — `schedule-items`: 일차별 장소 목록
 * — `schedule-item-route`: 장소 간 길찾기
 */
export async function dispatchRoomScheduleEvent(
  queryClient: QueryClient,
  event: RoomScheduleChangedEvent,
): Promise<void> {
  const rid = String(event.roomId ?? "").trim();
  if (!rid) return;
  const sid = event.scheduleId;

  switch (event.type) {
    case "SCHEDULE_CREATED":
      await queryClient.invalidateQueries({
        queryKey: roomSchedulesQueryKey(rid),
        refetchType: "active",
      });
      return;

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

    case "SCHEDULE_ITEM_DELETED":
      removeRouteQueriesForDeletedItemSource(queryClient, rid, sid, event.itemId);
      await queryClient.invalidateQueries({
        queryKey: scheduleItemsQueryKey(rid, sid),
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["schedule-item-route", rid],
        refetchType: "active",
      });
      return;

    case "SCHEDULE_ITEM_CREATED":
    case "SCHEDULE_ITEM_UPDATED":
    case "SCHEDULE_ITEMS_REORDERED":
    case "SCHEDULE_ITEM_TRAVEL_MODE_UPDATED":
      await queryClient.invalidateQueries({
        queryKey: scheduleItemsQueryKey(rid, sid),
        refetchType: "active",
      });
      await queryClient.invalidateQueries({
        queryKey: ["schedule-item-route", rid],
        refetchType: "active",
      });
      return;
  }
}
