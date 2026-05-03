import type { QueryClient } from "@tanstack/react-query";

import { roomSchedulesQueryKey } from "@/lib/queryKeys/roomSchedules";
import { scheduleItemsQueryKey } from "@/lib/queryKeys/scheduleItems";
import type { RoomScheduleChangedEvent } from "@/lib/stomp/schedule-events";

/** schedules 토픽 STOMP 한 건 처리 — 에코(본인 변경)는 무시, 타입별 부분 무효화 */
export async function dispatchRoomScheduleEvent(
  queryClient: QueryClient,
  event: RoomScheduleChangedEvent,
  currentUserId: number,
): Promise<void> {
  if (event.actorUserId === currentUserId) return;

  const rid = String(event.roomId ?? "").trim();
  if (!rid) return;

  switch (event.type) {
    case "SCHEDULE_CREATED":
      await queryClient.invalidateQueries({
        queryKey: roomSchedulesQueryKey(rid),
        refetchType: "all",
      });
      break;

    case "SCHEDULE_DELETED":
      queryClient.removeQueries({
        queryKey: scheduleItemsQueryKey(rid, event.scheduleId),
      });
      await queryClient.invalidateQueries({
        queryKey: roomSchedulesQueryKey(rid),
        refetchType: "all",
      });
      break;

    case "SCHEDULE_ITEM_CREATED":
    case "SCHEDULE_ITEM_UPDATED":
    case "SCHEDULE_ITEM_DELETED":
    case "SCHEDULE_ITEMS_REORDERED":
    case "TRAVEL_MODE_UPDATED":
      await queryClient.invalidateQueries({
        queryKey: scheduleItemsQueryKey(rid, event.scheduleId),
        refetchType: "all",
      });
      break;
  }
}
