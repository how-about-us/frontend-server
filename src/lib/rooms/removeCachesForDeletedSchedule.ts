import type { QueryClient } from "@tanstack/react-query";

import { clearPersistedScheduleRoutesForSchedule } from "@/lib/plan/planTravelLocalStorage";
import { scheduleItemsQueryKey } from "@/lib/queryKeys/scheduleItems";

/** 일차 삭제 후 route·items 쿼리 캐시 제거 (삭제된 scheduleId에 대한 GET 방지) */
export function removeCachesForDeletedSchedule(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
): void {
  const rid = roomId.trim();
  if (!rid.length) return;

  clearPersistedScheduleRoutesForSchedule(rid, scheduleId);

  queryClient.removeQueries({
    predicate: (q) => {
      const key = q.queryKey;
      if (!Array.isArray(key) || key[0] !== "schedule-item-route") {
        return false;
      }
      if (String(key[1] ?? "").trim() !== rid) return false;
      return key[2] === scheduleId;
    },
  });
  queryClient.removeQueries({
    queryKey: scheduleItemsQueryKey(rid, scheduleId),
  });
}
