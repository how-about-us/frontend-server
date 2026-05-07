/** 이 탭에서 방금 일차 DELETE를 보낸 경우 STOMP 에코를 한 번만 소비해 중복 refetch·GET /rooms 를 막습니다. */

const pendingDeletes = new Map<string, number>();
const TTL_MS = 5_000;

function entryKey(roomId: string, scheduleId: number): string {
  return `${roomId.trim()}\0${scheduleId}`;
}

export function markPendingScheduleDeleteEcho(
  roomId: string,
  scheduleId: number,
): void {
  pendingDeletes.set(entryKey(roomId, scheduleId), Date.now() + TTL_MS);
}

/** 이 탭이 보낸 삭제 에코이면 true 한 번만 반환하고 키를 제거합니다. */
export function consumePendingScheduleDeleteEcho(
  roomId: string,
  scheduleId: number,
): boolean {
  const k = entryKey(roomId, scheduleId);
  const expires = pendingDeletes.get(k);
  pendingDeletes.delete(k);
  return typeof expires === "number" && Date.now() <= expires;
}

export function clearPendingScheduleDeleteEcho(
  roomId: string,
  scheduleId: number,
): void {
  pendingDeletes.delete(entryKey(roomId, scheduleId));
}
