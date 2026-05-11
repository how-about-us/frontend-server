"use client";

import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getJoinRequests } from "@/lib/api/rooms";
import { joinRequestsQueryKey } from "@/lib/query-keys";
import { useSessionStore } from "@/stores/session-store";

const HOST_JOIN_REQUEST_TOAST_MS = 4000;

/** 호스트 개인 큐 — 새 입장 요청 시 캐시 무효화 + (현재 방이면) 배지 동기화 + 알림 */
export function dispatchHostJoinRequestFromStomp(
  queryClient: QueryClient,
  roomId: string,
  nickname: string,
): void {
  const label = nickname.trim().length > 0 ? nickname.trim() : "새 멤버";
  toast(`${label}님이 입장을 요청했습니다`, {
    duration: HOST_JOIN_REQUEST_TOAST_MS,
  });

  const rid = roomId.trim();
  if (!rid.length) return;

  void (async () => {
    await queryClient.invalidateQueries({
      queryKey: joinRequestsQueryKey(rid),
    });

    const current = useSessionStore.getState().currentRoomId?.trim() ?? "";
    if (current !== rid) return;

    try {
      const data = await queryClient.fetchQuery({
        queryKey: joinRequestsQueryKey(rid),
        queryFn: () => getJoinRequests(rid),
      });
      useSessionStore
        .getState()
        .setPendingJoinRequestsCount(data.requests.length);
    } catch {
      useSessionStore.getState().setPendingJoinRequestsCount(0);
    }
  })();
}
