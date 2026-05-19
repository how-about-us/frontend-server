import type { QueryClient } from "@tanstack/react-query";

import { ROOM_COVER_PERSIST_STORAGE_KEY } from "@/lib/room-cover-query";
import {
  clearCurrentRoomIdSessionStorage,
  removeLegacySessionPersistLocalStorage,
} from "@/lib/session-room-storage";
import { useSessionStore } from "@/stores/session-store";

const CHAT_LAST_SEEN_PREFIX = "hau:chat:lastSeen:v1:";
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
 * `userId`가 있으면 해당 사용자의 채팅 lastSeen만 제거하고, plan·RQ 캐시는 전부 제거하지 않음.
 * `userId`가 없으면 채팅·플랜·RQ persist 키를 모두 제거합니다.
 */
export function clearUserScopedBrowserStorage(userId?: number): void {
  if (typeof window === "undefined") return;

  if (userId != null) {
    const chatPrefix = `${CHAT_LAST_SEEN_PREFIX}${userId}:`;
    removeLocalStorageKeysMatching((k) => k.startsWith(chatPrefix));
    return;
  }

  removeLocalStorageKeysMatching(
    (k) =>
      k.startsWith(CHAT_LAST_SEEN_PREFIX) ||
      k.startsWith(PLAN_ROUTE_PREFIX) ||
      k.startsWith(PLAN_TRAVEL_MODE_PREFIX),
  );
  clearPersistedQueryClientCache();
}

export function clearPersistedQueryClientCache(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ROOM_COVER_PERSIST_STORAGE_KEY);
  } catch {
    /* ignore */
  }
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
