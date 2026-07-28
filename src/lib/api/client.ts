import { authenticatedFetch } from "@/lib/api/authenticated-fetch";
import { expireClientSessionAndRedirect } from "@/lib/auth-session-client";
import { fetchSessionUserRaw } from "@/lib/auth";
import { getQueryClient } from "@/lib/query-client";
import {
  readSessionUserCache,
  setSessionUserCache,
} from "@/lib/session-user-cache";

/**
 * Drop-in replacement for fetch that automatically retries once after
 * refreshing the access token on a 401 response.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const { response: res, didRefresh } = await authenticatedFetch(input, init);

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
