import { authenticatedFetch } from "@/lib/api/authenticated-fetch";
import { API_BASE } from "@/lib/api/config";

export interface SessionUser {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  provider: string;
}

export type FetchSessionUserResult =
  | { kind: "user"; user: SessionUser }
  | { kind: "unauthenticated" }
  | { kind: "network_error" };

/** GET /users/me — 401 시 BFF refresh 후 1회 재시도; 네트워크 오류는 별도 구분 */
export async function fetchSessionUserResult(): Promise<FetchSessionUserResult> {
  try {
    const { response: res } = await authenticatedFetch(`${API_BASE}/users/me`);
    if (!res.ok) return { kind: "unauthenticated" };
    const user = (await res.json()) as SessionUser;
    return { kind: "user", user };
  } catch {
    return { kind: "network_error" };
  }
}

export async function fetchSessionUserRaw(): Promise<SessionUser | null> {
  const result = await fetchSessionUserResult();
  return result.kind === "user" ? result.user : null;
}

export async function fetchSessionUserWithRetry(
  attempts = 3,
  baseDelayMs = 350,
): Promise<SessionUser | null> {
  for (let i = 0; i < attempts; i++) {
    const result = await fetchSessionUserResult();
    if (result.kind === "user") return result.user;
    if (result.kind === "unauthenticated") return null;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
    }
  }
  return null;
}
