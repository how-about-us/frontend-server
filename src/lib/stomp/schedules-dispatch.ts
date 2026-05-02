import type { QueryClient } from "@tanstack/react-query";

import { roomSchedulesQueryKey } from "@/lib/queryKeys/roomSchedules";

/** schedules 토픽 수신 시 일정 목록 쿼리 무효화 */
export async function invalidateRoomSchedulesQueries(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  const rid = String(roomId ?? "").trim();
  if (!rid) return;
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: roomSchedulesQueryKey(rid),
    }),
    queryClient.invalidateQueries({
      queryKey: ["schedule-items", rid],
    }),
  ]);
}
