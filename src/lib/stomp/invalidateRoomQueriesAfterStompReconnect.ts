import type { QueryClient } from "@tanstack/react-query";

import { roomSchedulesQueryKey } from "@/lib/queryKeys/roomSchedules";

/**
 * 재연결·`onConnect` 직후 해당 방 관련 활성 쿼리만 다시 맞춥니다.
 *
 * `room-members`는 제외: 연결 직전·직후 이중 GET으로 첫 응답만 오프라인으로 깨지는 문제가 있고,
 * `useRoomMembers`는 STOMP 연결까지 `enabled`를 막은 뒤 `disabled→enabled` 전환으로 자동 refetch 된다.
 */
export function invalidateRoomQueriesAfterStompReconnect(
  queryClient: QueryClient,
  roomId: string,
): void {
  const rid = roomId.trim();
  if (!rid) return;

  const opts = { refetchType: "active" as const };

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
