import type { QueryClient } from "@tanstack/react-query";

import { roomSchedulesQueryKey } from "@/lib/queryKeys/roomSchedules";
import { scheduleItemsQueryKey } from "@/lib/queryKeys/scheduleItems";
import type { RoomScheduleChangedEvent } from "@/lib/stomp/schedule-events";

/**
 * schedules 토픽 STOMP 처리 — 브로드캐스트만으로 목록·길찾기 캐시 갱신(뮤테이션 onSuccess 무효화 없음 전제).
 * 일정 행렬이 줄어든 경우 해당 scheduleId 항목 쿼리는 제거합니다.
 */
export async function dispatchRoomScheduleEvent(
  queryClient: QueryClient,
  event: RoomScheduleChangedEvent,
): Promise<void> {
  const rid = String(event.roomId ?? "").trim();
  if (!rid) return;

  if (event.type === "SCHEDULE_DELETED") {
    queryClient.removeQueries({
      predicate: (q) => {
        const key = q.queryKey;
        if (!Array.isArray(key) || key[0] !== "schedule-item-route") {
          return false;
        }
        if (String(key[1] ?? "").trim() !== rid) return false;
        return key[2] === event.scheduleId;
      },
    });
  }

  if (event.type === "SCHEDULE_ITEM_DELETED") {
    queryClient.removeQueries({
      predicate: (q) => {
        const key = q.queryKey;
        if (!Array.isArray(key) || key[0] !== "schedule-item-route") {
          return false;
        }
        if (String(key[1] ?? "").trim() !== rid) return false;
        if (key[2] !== event.scheduleId) return false;
        return key[3] === event.itemId;
      },
    });
  }

  await queryClient.invalidateQueries({
    queryKey: ["schedule-item-route", rid],
    refetchType: "active",
  });

  if (event.type === "SCHEDULE_DELETED") {
    queryClient.removeQueries({
      queryKey: scheduleItemsQueryKey(rid, event.scheduleId),
    });
  }

  await queryClient.invalidateQueries({
    queryKey: roomSchedulesQueryKey(rid),
    refetchType: "all",
  });

  await queryClient.invalidateQueries({
    queryKey: ["schedule-items", rid],
    refetchType: "all",
  });
}
