/**
 * 비로그인 상태에서 초대 URL(`/join/[inviteCode]`)을 탄 사용자가
 * Google OAuth 후 다시 해당 방의 입장 흐름으로 복귀할 수 있도록
 * 초대 코드를 sessionStorage 에 임시 보관한다.
 *
 * 키 일관성을 위해 setter/consumer 를 한 곳에서 관리한다.
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
