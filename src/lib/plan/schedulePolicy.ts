import { parseLocalYmd } from "@/lib/plan/tripRange";

/** 백엔드 `SchedulePolicy.MAX_SCHEDULES_PER_ROOM` 과 동기화 */
export const MAX_SCHEDULES_PER_ROOM = 30;

export const TRIP_SCHEDULE_DAY_LIMIT_MESSAGE =
  `여행 기간은 최대 ${MAX_SCHEDULES_PER_ROOM}일까지예요.` as const;

const MS_PER_DAY = 86_400_000;

/** start~end 포함 일수 (유효하지 않은 범위면 0) */
export function inclusiveTripDayCount(startYmd: string, endYmd: string): number {
  const start = startYmd.trim();
  const end = endYmd.trim();
  if (!start || !end || end < start) return 0;
  const startMs = parseLocalYmd(start).getTime();
  const endMs = parseLocalYmd(end).getTime();
  return Math.round((endMs - startMs) / MS_PER_DAY) + 1;
}

export function isTripScheduleDayLimitExceeded(
  startYmd: string,
  endYmd: string,
): boolean {
  const days = inclusiveTripDayCount(startYmd, endYmd);
  return days > MAX_SCHEDULES_PER_ROOM;
}

/** 날짜 변경 후 제거될 일차 수 (0이면 경고 불필요) */
export function countSchedulesTrimmedByDateChange(
  currentScheduleCount: number,
  oldStart: string,
  oldEnd: string,
  newStart: string,
  newEnd: string,
): number {
  const newDays = inclusiveTripDayCount(newStart, newEnd);
  const oldDays = inclusiveTripDayCount(oldStart, oldEnd);
  const baseline = Math.max(currentScheduleCount, oldDays);
  return Math.max(0, baseline - newDays);
}
