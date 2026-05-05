"use client";

import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const HOST_JOIN_REQUEST_TOAST_MS = 4000;

/** 호스트 개인 큐 — 새 입장 요청 시 목록 무효화(활성 observer refetch) + 알림 */
export function dispatchHostJoinRequestFromStomp(
  queryClient: QueryClient,
  roomId: string,
  nickname: string,
): void {
  const label = nickname.trim().length > 0 ? nickname.trim() : "새 멤버";
  toast(`${label}님이 입장을 요청했습니다`, {
    duration: HOST_JOIN_REQUEST_TOAST_MS,
  });

  void queryClient.invalidateQueries({
    queryKey: ["join-requests", roomId] as const,
  });
}
