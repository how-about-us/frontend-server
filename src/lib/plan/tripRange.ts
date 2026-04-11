import type { PlanDayData, PlanPlace } from "@/mocks/plan";

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatKoreanDateLabel(d: Date): string {
  const w = WEEKDAYS_KO[d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${w})`;
}

/** 시작~끝(포함) 각 날짜에 빈 장소 목록으로 PlanDayData 생성 */
export function buildPlanDaysFromRange(
  start: Date,
  end: Date,
  emptyPlaces: PlanPlace[] = [],
): PlanDayData[] {
  const a = startOfLocalDay(start);
  const b = startOfLocalDay(end);
  if (b < a) {
    return buildPlanDaysFromRange(b, a, emptyPlaces);
  }
  const out: PlanDayData[] = [];
  const cursor = new Date(a);
  let n = 1;
  while (cursor <= b) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth() + 1;
    const day = cursor.getDate();
    out.push({
      id: `day-${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      dayLabel: `${n}일차`,
      dateLabel: formatKoreanDateLabel(cursor),
      places: [...emptyPlaces],
    });
    cursor.setDate(cursor.getDate() + 1);
    n++;
  }
  return out;
}

/** 달력 한 칸: 해당 월이 아니면 null */
export function buildMonthCells(year: number, monthIndex0: number): (Date | null)[] {
  const first = new Date(year, monthIndex0, 1);
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();
  const pad = first.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push(new Date(year, monthIndex0, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
