import { fetchSessionUserRaw } from "@/lib/auth";
import { tearDownClientSession } from "@/lib/client-storage";
import { getQueryClient } from "@/lib/query-client";
import {
  readSessionUserCache,
  setSessionUserCache,
} from "@/lib/session-user-cache";
import { refreshToken } from "./auth";

// Deduplicate concurrent refresh attempts into a single request
let pendingRefresh: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (!pendingRefresh) {
    pendingRefresh = refreshToken()
      .then((r) => r.ok)
      .finally(() => {
        pendingRefresh = null;
      });
  }
  return pendingRefresh;
}

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
  const opts: RequestInit = { credentials: "include", ...init };
  const res = await fetch(input, opts);

  if (res.status !== 401) return res;

  const refreshed = await tryRefresh();
  if (!refreshed) {
    clearSessionAndRedirect();
    return res;
  }

  const queryClient = getQueryClient();
  if (queryClient && readSessionUserCache(queryClient) == null) {
    const user = await fetchSessionUserRaw();
    if (user) setSessionUserCache(queryClient, user);
  }

  return fetch(input, opts);
}
