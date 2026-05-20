import type { QueryClient } from "@tanstack/react-query";

import {
  clearCurrentRoomIdSessionStorage,
  removeLegacySessionPersistLocalStorage,
} from "@/lib/session-room-storage";
import { useSessionStore } from "@/stores/session-store";

const PLAN_ROUTE_PREFIX = "hau:plan:route:v1:";
const PLAN_TRAVEL_MODE_PREFIX = "hau:plan:travelMode:v1:";

function removeLocalStorageKeysMatching(
  predicate: (key: string) => boolean,
): void {
  if (typeof window === "undefined") return;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && predicate(k)) toRemove.push(k);
  }
  for (const k of toRemove) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* quota / private mode */
    }
  }
}

/**
 * 로그아웃·세션 무효·계정 전환 시 사용자/방 관련 localStorage 정리.
 */
export function clearUserScopedBrowserStorage(): void {
  if (typeof window === "undefined") return;

  removeLocalStorageKeysMatching(
    (k) =>
      k.startsWith(PLAN_ROUTE_PREFIX) || k.startsWith(PLAN_TRAVEL_MODE_PREFIX),
  );
}

/** Zustand persist·사용자 범위 LS·(선택) React Query 메모리 캐시 (HttpOnly는 `/api/auth/logout`) */
export function tearDownClientSession(options?: {
  queryClient?: QueryClient;
}): void {
  clearCurrentRoomIdSessionStorage();
  removeLegacySessionPersistLocalStorage();
  useSessionStore.getState().clearUser();
  clearUserScopedBrowserStorage();
  options?.queryClient?.clear();
}
