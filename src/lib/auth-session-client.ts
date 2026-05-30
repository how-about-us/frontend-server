import type { QueryClient } from "@tanstack/react-query";

import { tearDownClientSession } from "@/lib/client-storage";
import { getQueryClient } from "@/lib/query-client";

/** 로그인·초대·OAuth 구간에서는 리다이렉트하지 않습니다. */
function shouldRedirectToLoginFromPath(pathname: string): boolean {
  if (pathname === "/login") return false;
  if (pathname.startsWith("/join/")) return false;
  if (pathname.startsWith("/auth/")) return false;
  return true;
}

/**
 * HttpOnly 세션 무효 시 클라이언트 user 캐시·방 포인터 정리 후 로그인으로 이동합니다.
 * (STOMP 복구 실패·API 401 등 공통)
 */
export function expireClientSessionAndRedirect(options?: {
  queryClient?: QueryClient;
}): void {
  const queryClient = options?.queryClient ?? getQueryClient() ?? undefined;
  tearDownClientSession({ queryClient });

  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (!shouldRedirectToLoginFromPath(path)) return;
  window.location.replace("/login");
}
