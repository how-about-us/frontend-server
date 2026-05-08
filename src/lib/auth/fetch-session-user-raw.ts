import { API_BASE } from "@/lib/api/config";
import type { SessionUser } from "@/stores/session-store";

/**
 * `apiFetch` 없이 GET /users/me — `apiFetch`의 401→refresh 재귀를 피할 때 사용.
 */
export async function fetchSessionUserRaw(): Promise<SessionUser | null> {
  const res = await fetch(`${API_BASE}/users/me`, { credentials: "include" });
  if (!res.ok) return null;
  return res.json() as Promise<SessionUser>;
}
