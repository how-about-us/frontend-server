import type { QueryClient } from "@tanstack/react-query";

import { roomMembersQueryKey } from "@/lib/queryKeys/rooms";
import { roomSchedulesQueryKey } from "@/lib/queryKeys/roomSchedules";

/** 재연결·`onConnect` 직후 해당 방 관련 활성 쿼리만 다시 맞춥니다. */
export function invalidateRoomQueriesAfterStompReconnect(
  queryClient: QueryClient,
  roomId: string,
): void {
  const rid = roomId.trim();
  if (!rid) return;

  const opts = { refetchType: "active" as const };

  void queryClient.invalidateQueries({
    queryKey: roomMembersQueryKey(rid),
    ...opts,
  });
  void queryClient.invalidateQueries({
    queryKey: roomSchedulesQueryKey(rid),
    ...opts,
  });
  void queryClient.invalidateQueries({
    queryKey: ["schedule-items", rid],
    ...opts,
  });
  void queryClient.invalidateQueries({
    queryKey: ["schedule-item-route", rid],
    ...opts,
  });
}
