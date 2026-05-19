import { apiFetch } from "@/lib/api/client";
import { API_BASE } from "@/lib/api/config";
import { isProtectedAppPath } from "@/lib/auth-session";
import {
  clearUserScopedBrowserStorage,
  tearDownClientSession,
} from "@/lib/client-storage";
import type { SessionUser } from "@/stores/session-store";
import { useSessionStore } from "@/stores/session-store";

/**
 * `apiFetch` 없이 GET /users/me — `apiFetch`의 401→refresh 재귀를 피할 때 사용.
 */
export async function fetchSessionUserRaw(): Promise<SessionUser | null> {
  const res = await fetch(`${API_BASE}/users/me`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json() as Promise<SessionUser>;
}

/** 클라이언트 — HttpOnly 세션 검증 (`GET /api/auth/session`) */
export async function checkClientAuthenticated(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const res = await fetch("/api/auth/session", {
    credentials: "include",
    cache: "no-store",
  });
  return res.ok;
}

/**
 * 비로그인 상태에서 초대 URL(`/join/[inviteCode]`)을 탄 사용자가
 * Google OAuth 후 다시 해당 방의 입장 흐름으로 복귀할 수 있도록
 * 초대 코드를 sessionStorage 에 임시 보관한다.
 */
const PENDING_INVITE_KEY = "pendingInviteCode";

export function setPendingInviteCode(code: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_INVITE_KEY, code);
}

/** 한 번만 사용할 값이라 읽으면서 곧바로 비운다. */
export function consumePendingInviteCode(): string | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(PENDING_INVITE_KEY);
  if (value) sessionStorage.removeItem(PENDING_INVITE_KEY);
  return value;
}

async function fetchSessionUser(): Promise<SessionUser | null> {
  const res = await apiFetch(`${API_BASE}/users/me`);
  if (!res.ok) return null;
  return res.json() as Promise<SessionUser>;
}

/**
 * OAuth 직후 쿠키가 잡히기 전 짧은 레이스를 흡수하기 위한 재시도.
 */
export async function fetchSessionUserWithRetry(
  attempts = 3,
  baseDelayMs = 350,
): Promise<SessionUser | null> {
  for (let i = 0; i < attempts; i++) {
    const user = await fetchSessionUser();
    if (user) return user;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
    }
  }
  return null;
}

/**
 * Zustand rehydrate 이후 HttpOnly 세션·`users/me`로 메모리 `user`를 맞춥니다.
 * persist에는 `currentRoomId`만 저장됩니다.
 * `/auth/callback` 은 OAuth 핸들러가 전담하므로 건너뜁니다.
 */
export async function reconcileClientSession(): Promise<void> {
  if (typeof window === "undefined") return;

  const path = window.location.pathname;
  if (path.startsWith("/auth/callback")) return;

  useSessionStore.getState().setSessionReady(false);

  try {
    const prevUser = useSessionStore.getState().user;
    const user = await fetchSessionUser();

    if (user) {
      if (prevUser != null && prevUser.id !== user.id) {
        clearUserScopedBrowserStorage();
        useSessionStore.getState().clearUser();
      }
      useSessionStore.getState().setUser(user);
      return;
    }

    tearDownClientSession();
    if (isProtectedAppPath(path)) {
      window.location.replace("/login");
    }
  } finally {
    useSessionStore.getState().setSessionReady(true);
  }
}

/** @deprecated `reconcileClientSession` 사용 */
export async function syncSessionUserFromServer(): Promise<void> {
  await reconcileClientSession();
}
