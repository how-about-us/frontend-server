/** OAuth·초대 등 인증 흐름 부가 유틸 */

export async function checkClientAuthenticated(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const res = await fetch("/api/auth/session", {
    credentials: "include",
    cache: "no-store",
  });
  return res.ok;
}

const PENDING_INVITE_KEY = "pendingInviteCode";

export function setPendingInviteCode(code: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_INVITE_KEY, code);
}

export function consumePendingInviteCode(): string | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(PENDING_INVITE_KEY);
  if (value) sessionStorage.removeItem(PENDING_INVITE_KEY);
  return value;
}

