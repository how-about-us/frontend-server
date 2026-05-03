/** 구간별 길찾기 API 결과 — 브로드캐스트로 무효화 시 prefix `["schedule-item-route", roomId]` 사용 */
export const scheduleItemRouteQueryKey = (
  roomId: string | null,
  scheduleId: number | null,
  segmentSourceItemId: number | null,
  /** GET 쿼리 `travelMode` — 생략 시 서버 저장 수단 */
  travelModeQuery: string | null = null,
) =>
  [
    "schedule-item-route",
    roomId,
    scheduleId,
    segmentSourceItemId,
    travelModeQuery?.trim()?.length ? travelModeQuery.trim() : "__saved",
  ] as const;
