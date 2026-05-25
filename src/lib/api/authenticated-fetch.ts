import { tryClientRefresh } from "@/lib/api/auth";

export type AuthenticatedFetchResult = {
  response: Response;
  /** access 만료로 refresh 후 동일 요청을 재시도했는지 */
  didRefresh: boolean;
};

/**
 * credentials: include fetch.
 * 401이면 BFF refresh 1회 후 동일 요청을 재시도한다.
 * refresh 실패 시 최초 401 Response를 그대로 반환한다.
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<AuthenticatedFetchResult> {
  const opts: RequestInit = { credentials: "include", ...init };
  const res = await fetch(input, opts);

  if (res.status !== 401) {
    return { response: res, didRefresh: false };
  }

  const refreshed = await tryClientRefresh();
  if (!refreshed) {
    return { response: res, didRefresh: false };
  }

  return {
    response: await fetch(input, opts),
    didRefresh: true,
  };
}
