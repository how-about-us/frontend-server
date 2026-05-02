/** `/plan/:roomId` 한 단계 세그먼트만 허용 (pathname 기준) */
const PLAN_ROOM_PATTERN = /^\/plan\/([^/]+)$/;

export function roomIdFromPlanPath(pathname: string): string | null {
  const m = PLAN_ROOM_PATTERN.exec(pathname);
  return m?.[1] ?? null;
}

/** (main): URL(`/plan/[roomId]`) 우선, 없으면 세션 `currentRoomId` */
export function resolveEffectiveMainRoomId(
  pathname: string,
  storedRoomId: string | null,
): string | null {
  const fromPlan = roomIdFromPlanPath(pathname);
  return fromPlan ?? storedRoomId;
}
