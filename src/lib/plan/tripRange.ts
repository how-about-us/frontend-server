import type { PlanDayData, PlanPlace } from "@/mocks/plan";

const WEEKDAYS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** `YYYY-MM-DD`를 로컬 자정 기준 `Date`로 파싱합니다. */
export function parseLocalYmd(s: string): Date {
  const parts = s.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (
    y === undefined ||
    m === undefined ||
    d === undefined ||
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(d)
  ) {
    return startOfLocalDay(new Date());
  }
  return new Date(y, m - 1, d);
}

export function formatDateYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 방 생성 시 기간 문자열(포함) 각 날짜에 대해 `dayNumber`는 1부터 순번입니다.
 */
export function eachInclusiveTripDay(
  startYmd: string,
  endYmd: string,
): { date: string; dayNumber: number }[] {
  const a = parseLocalYmd(startYmd);
  const b = parseLocalYmd(endYmd);
  const lo = a <= b ? a : b;
  const hi = a <= b ? b : a;
  const out: { date: string; dayNumber: number }[] = [];
  const c = new Date(lo);
  let dayNumber = 1;
  while (c <= hi) {
    out.push({ date: formatDateYmd(c), dayNumber });
    c.setDate(c.getDate() + 1);
    dayNumber++;
  }
  return out;
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

/** 시작·종료(포함) 사이의 현지 기준 일 수 */
export function countInclusiveLocalDays(start: Date, end: Date): number {
  const a = startOfLocalDay(start);
  const b = startOfLocalDay(end);
  if (b < a) {
    return countInclusiveLocalDays(b, a);
  }
  let n = 0;
  const c = new Date(a);
  while (c <= b) {
    n++;
    c.setDate(c.getDate() + 1);
  }
  return n;
}

export function mergePlanDaysWithPlaces(
  start: Date,
  end: Date,
  placesPerDay: PlanPlace[][],
): PlanDayData[] {
  const shells = buildPlanDaysFromRange(start, end);
  return shells.map((d, i) => ({
    ...d,
    places: placesPerDay[i] ?? [],
  }));
}

/** 현지 자정 기준으로 `n`일만큼 이전 날짜 */
export function subtractLocalDays(d: Date, n: number): Date {
  const x = startOfLocalDay(d);
  x.setDate(x.getDate() - n);
  return x;
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
