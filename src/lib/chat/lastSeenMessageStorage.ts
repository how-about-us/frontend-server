const NS = "hau:chat:lastSeen:v1";

function storageKey(userId: number, roomId: string): string {
  return `${NS}:${userId}:${roomId.trim()}`;
}

/**
 * 방별 마지막으로 처리한 메시지 id — `GET afterId` 동기화 커서.
 * 새로고침 후에도 유지되도록 localStorage 사용.
 */
export function getLastSeenMessageId(
  userId: number | null | undefined,
  roomId: string | null | undefined,
): string | null {
  if (userId == null || !roomId) return null;
  const rid = roomId.trim();
  if (!rid.length) return null;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(userId, rid));
    if (typeof raw !== "string") return null;
    const t = raw.trim();
    return t.length > 0 ? t : null;
  } catch {
    return null;
  }
}

export function setLastSeenMessageId(
  userId: number | null | undefined,
  roomId: string | null | undefined,
  messageId: string,
): void {
  if (userId == null || !roomId) return;
  const rid = roomId.trim();
  if (!rid.length) return;
  const id = messageId.trim();
  if (!id.length) return;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId, rid), id);
  } catch {
    /* quota / private mode */
  }
}
