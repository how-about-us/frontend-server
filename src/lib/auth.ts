import { apiFetch } from "@/lib/api/client";
import { API_BASE } from "@/lib/api/config";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";
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

function hasAuthSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => {
    const [k, v] = c.trim().split("=");
    return k === AUTH_SESSION_COOKIE && v === "1";
  });
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

export async function syncSessionUserFromServer(): Promise<void> {
  if (!hasAuthSessionCookie()) return;

  const user = await fetchSessionUser();
  if (user) {
    useSessionStore.getState().setUser(user);
  }
}

export function clearStalePersistedSessionIfNoAuthCookie(): void {
  if (!hasAuthSessionCookie()) {
    const path =
      typeof window !== "undefined" ? window.location.pathname : "";
    if (path.startsWith("/auth/callback")) return;
    const { user } = useSessionStore.getState();
    if (user != null) {
      useSessionStore.getState().clearUser();
    }
  }
}
