import { apiFetch } from "@/lib/api/client";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";
import { API_BASE } from "@/lib/api/config";
import type { SessionUser } from "@/stores/session-store";
import { useSessionStore } from "@/stores/session-store";

function hasAuthSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split(";").some((c) => {
    const [k, v] = c.trim().split("=");
    return k === AUTH_SESSION_COOKIE && v === "1";
  });
}

/**
 * 현재 브라우저 쿠키 세션으로 GET /users/me (refresh 한 번 포함).
 * 401이면 apiFetch가 로그아웃 처리할 수 있음.
 */
export async function fetchSessionUser(): Promise<SessionUser | null> {
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
 * localStorage에 캐시된 프로필과 서버 세션을 맞춥니다.
 * 브라우저별 Network `users/me`와 `hau:session` 불일치를 줄입니다.
 *
 * 참고: 여기서 고칠 수 없는 경우 — 각 브라우저의 `users/me`가 동일한데
 * 방 멤버만 같다면 백엔드의 Google→내부 user 매핑, `rooms/join` 멤버
 * 생성/중복 처리 로직을 추적해야 합니다.
 */
export async function syncSessionUserFromServer(): Promise<void> {
  if (!hasAuthSessionCookie()) return;

  const user = await fetchSessionUser();
  if (user) {
    useSessionStore.getState().setUser(user);
  }
}

/**
 * 인증 쿠키가 없는데 LS에 사용자가 남아 있으면 `clearUser`로 프로필·방 컨텍스트를 비웁니다.
 * OAuth 콜백 경로에서는 쿠키 세팅 레이스를 피하기 위해 스킵합니다.
 */
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
