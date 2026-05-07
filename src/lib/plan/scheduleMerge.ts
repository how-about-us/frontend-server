import type {
  RoomSchedule,
  RoomScheduleCreateRequest,
} from "@/lib/api/rooms/schedules";
import type { PlanDayData } from "@/lib/plan/types";

import {
  formatDateYmd,
  formatKoreanDateLabel,
  parseLocalYmd,
  startOfLocalDay,
} from "@/lib/plan/tripRange";

export function sortRoomSchedules<T extends { dayNumber: number; date: string }>(
  schedules: T[],
): T[] {
  return [...schedules].sort((a, b) => {
    if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber;
    return a.date.localeCompare(b.date);
  });
}

export function rangeFromSchedules(
  schedules: RoomSchedule[],
): { start: Date; end: Date } | null {
  if (!schedules.length) return null;
  const times = schedules.map((s) => parseLocalYmd(s.date).getTime());
  const start = startOfLocalDay(new Date(Math.min(...times)));
  const end = startOfLocalDay(new Date(Math.max(...times)));
  return { start, end };
}

export function mergeSchedulesWithPlaces(schedules: RoomSchedule[]): PlanDayData[] {
  const sorted = sortRoomSchedules(schedules);
  return sorted.map((s, i) => ({
    id: `schedule-${s.scheduleId}`,
    dayLabel: `${i + 1}일차`,
    dateLabel: formatKoreanDateLabel(parseLocalYmd(s.date)),
    places: [],
  }));
}

/** 정렬된 일차 목록 기준으로 다음 일차 생성 요청 바디(마지막 날 +1일 또는 첫 일차). */
export function buildNextScheduleCreateBody(
  sorted: RoomSchedule[],
): RoomScheduleCreateRequest {
  if (sorted.length === 0) {
    return { dayNumber: 1, date: formatDateYmd(startOfLocalDay(new Date())) };
  }
  const last = sorted[sorted.length - 1]!;
  const d = new Date(parseLocalYmd(last.date));
  d.setDate(d.getDate() + 1);
  return { dayNumber: last.dayNumber + 1, date: formatDateYmd(d) };
}
