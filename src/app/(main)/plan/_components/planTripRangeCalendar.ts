import { startOfLocalDay } from "@/lib/plan/tripRange";

export function monthTitle(year: number, monthIndex0: number): string {
  return `${monthIndex0 + 1}월 ${year}`;
}

export function shiftMonth(year: number, monthIndex0: number, delta: number) {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

export function inInclusiveRange(
  d: Date,
  start: Date | null,
  end: Date | null,
): boolean {
  if (!start || !end) return false;
  const t = startOfLocalDay(d).getTime();
  const a = startOfLocalDay(start).getTime();
  const b = startOfLocalDay(end).getTime();
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return t >= lo && t <= hi;
}
