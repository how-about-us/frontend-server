/**
 * 구간별 길찾기 API 결과 (`GET …/route`, `travelMode` 미지정 — 서버 저장 수단).
 * 무효화: `["schedule-item-route", roomId]` prefix.
 */
export const scheduleItemRouteQueryKey = (
  roomId: string | null,
  scheduleId: number | null,
  segmentSourceItemId: number | null,
) =>
  [
    "schedule-item-route",
    roomId,
    scheduleId,
    segmentSourceItemId,
  ] as const;
