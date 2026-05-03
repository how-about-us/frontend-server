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
