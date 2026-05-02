import type { RoomSchedule } from "@/lib/api/rooms/schedules";
import type { PlanDayData } from "@/mocks/plan";

import {
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
