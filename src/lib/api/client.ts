import { authenticatedFetch } from "@/lib/api/authenticated-fetch";
import { expireClientSessionAndRedirect } from "@/lib/auth-session-client";
import { fetchSessionUserRaw } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import {
  readSessionUserCache,
  setSessionUserCache,
} from "@/lib/session-user-cache";

/**
 * [임시 계측] 백엔드 로그에서 호출 출처(화면)를 구분하기 위한 헤더를 붙입니다.
 * 측정이 끝나면 chore/gcp-photo-metrics 브랜치와 함께 폐기합니다.
 */
function withDebugSourceHeader(init?: RequestInit): RequestInit | undefined {
  if (typeof window === "undefined") return init;
  try {
    const headers = new Headers(init?.headers);
    headers.set("X-Debug-Source", window.location.pathname);
    return { ...init, headers };
  } catch {
    return init;
  }
}

/**
 * Drop-in replacement for fetch that automatically retries once after
 * refreshing the access token on a 401 response.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const { response: res, didRefresh } = await authenticatedFetch(
    input,
    withDebugSourceHeader(init),
  );

  if (res.status === 401) {
    expireClientSessionAndRedirect({
      queryClient: getQueryClient() ?? undefined,
    });
    return res;
  }

  if (didRefresh) {
    const queryClient = getQueryClient();
    if (queryClient && readSessionUserCache(queryClient) == null) {
      const user = await fetchSessionUserRaw();
      if (user) setSessionUserCache(queryClient, user);
    }
  }

  return res;
}
