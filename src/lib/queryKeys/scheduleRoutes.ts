import type { ScheduleTravelModeValue } from "@/lib/plan/scheduleTravelMode";

/**
 * 구간별 길찾기 API 결과 (`GET …/route?travelMode=…`).
 * 무효화: `["schedule-item-route", roomId]` prefix.
 */
export const scheduleItemRouteQueryKey = (
  roomId: string | null,
  scheduleId: number | null,
  segmentSourceItemId: number | null,
  travelMode: ScheduleTravelModeValue | null,
) =>
  [
    "schedule-item-route",
    roomId,
    scheduleId,
    segmentSourceItemId,
    travelMode,
  ] as const;
