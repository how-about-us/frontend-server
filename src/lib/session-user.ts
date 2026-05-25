import { authenticatedFetch } from "@/lib/api/authenticated-fetch";
import { API_BASE } from "@/lib/api/config";

export interface SessionUser {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  provider: string;
}

/** GET /users/me — 401 시 BFF refresh 후 1회 재시도 */
export async function fetchSessionUserRaw(): Promise<SessionUser | null> {
  const { response: res } = await authenticatedFetch(`${API_BASE}/users/me`);
  if (!res.ok) return null;
  return res.json() as Promise<SessionUser>;
}

export async function fetchSessionUserWithRetry(
  attempts = 3,
  baseDelayMs = 350,
): Promise<SessionUser | null> {
  for (let i = 0; i < attempts; i++) {
    const user = await fetchSessionUserRaw();
    if (user) return user;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
    }
  }
  return null;
}
