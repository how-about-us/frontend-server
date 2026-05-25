import type { QueryClient } from "@tanstack/react-query";

import { isProtectedAppPath } from "@/lib/auth-session";
import { clearUserScopedBrowserStorage, tearDownClientSession } from "@/lib/client-storage";
import {
  fetchSessionUserRaw,
  fetchSessionUserWithRetry,
} from "@/lib/session-user";
import {
  readSessionUserCache,
  setSessionUserCache,
} from "@/lib/session-user-cache";
import { useSessionStore } from "@/stores/session-store";

export type { SessionUser } from "@/lib/session-user";
export {
  checkClientAuthenticated,
  consumePendingInviteCode,
  setPendingInviteCode,
} from "@/lib/session-user-flow";
export { fetchSessionUserRaw, fetchSessionUserWithRetry };

const RECONCILE_SKIP_PATH_PREFIXES = ["/auth/callback", "/login"] as const;

function shouldSkipReconcileClientSession(pathname: string): boolean {
  return RECONCILE_SKIP_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** HttpOnly 세션·`users/me`로 Query user 캐시를 맞춥니다. */
export async function reconcileClientSession(
  queryClient: QueryClient,
): Promise<void> {
  if (typeof window === "undefined") return;

  const path = window.location.pathname;
  if (shouldSkipReconcileClientSession(path)) return;

  useSessionStore.getState().setSessionReady(false);

  try {
    const prevUser = readSessionUserCache(queryClient);
    const user = await fetchSessionUserRaw();

    if (user) {
      if (prevUser != null && prevUser.id !== user.id) {
        clearUserScopedBrowserStorage();
        useSessionStore.getState().clearSessionRoomContext();
        setSessionUserCache(queryClient, null);
      }
      setSessionUserCache(queryClient, user);
      return;
    }

    tearDownClientSession({ queryClient });
    if (isProtectedAppPath(path)) {
      window.location.replace("/login");
    }
  } finally {
    useSessionStore.getState().setSessionReady(true);
  }
}
