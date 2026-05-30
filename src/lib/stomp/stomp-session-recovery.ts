import type { QueryClient } from "@tanstack/react-query";

import { expireClientSessionAndRedirect } from "@/lib/auth-session-client";
import { checkClientAuthenticated } from "@/lib/session-user-flow";
import { fetchSessionUserRaw } from "@/lib/session-user";
import { setSessionUserCache } from "@/lib/session-user-cache";

/** 백엔드 access 만료 시 WebSocket close code (분기·로깅 참고용) */
export const STOMP_ACCESS_TOKEN_EXPIRED_CLOSE_CODE = 4001;

export type RenewSessionAfterStompCloseResult =
  | { ok: true }
  | { ok: false };

/**
 * WebSocket 종료 후 `GET /api/auth/session`으로 access 갱신을 시도하고,
 * 성공 시 session user Query 캐시를 맞춥니다.
 */
export async function renewSessionAfterStompClose(
  queryClient: QueryClient,
): Promise<RenewSessionAfterStompCloseResult> {
  const authenticated = await checkClientAuthenticated();
  if (!authenticated) {
    return { ok: false };
  }

  const user = await fetchSessionUserRaw();
  if (!user) {
    return { ok: false };
  }

  setSessionUserCache(queryClient, user);
  return { ok: true };
}

/** session 갱신 실패 — 클라이언트 세션 정리 및 로그인 이동 */
export function handleStompSessionExpired(queryClient: QueryClient): void {
  expireClientSessionAndRedirect({ queryClient });
}
