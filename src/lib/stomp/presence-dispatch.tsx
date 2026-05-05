"use client";

import type { QueryClient } from "@tanstack/react-query";

/** presence STOMP 한 건 — GET /rooms/{roomId}/members 로 온라인 상태 재동기화 */
export async function dispatchRoomPresence(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: ["room-members", roomId],
    refetchType: "active",
  });
}
