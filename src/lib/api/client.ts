import { authenticatedFetch } from "@/lib/api/authenticated-fetch";
import { fetchSessionUserRaw } from "@/lib/auth";
import { tearDownClientSession } from "@/lib/client-storage";
import { getQueryClient } from "@/lib/query-client";
import {
  readSessionUserCache,
  setSessionUserCache,
} from "@/lib/session-user-cache";

function clearSessionAndRedirect() {
  tearDownClientSession({ queryClient: getQueryClient() ?? undefined });
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (
    path === "/login" ||
    path.startsWith("/join/") ||
    path.startsWith("/auth/")
  ) {
    return;
  }
  window.location.replace("/login");
}

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
    clearSessionAndRedirect();
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
