import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";
import { useSessionStore } from "@/stores/session-store";
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
  document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  useSessionStore.getState().clearUser();
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

  return fetch(input, opts);
}
