const MINUTES_PER_DAY = 24 * 60;

/** 일정 항목 체류(분) 입력·저장 상한 */
export const SCHEDULE_STAY_DURATION_MAX_MINUTES = 1000;

export function clampStayDurationMinutes(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return Math.min(Math.max(0, n), SCHEDULE_STAY_DURATION_MAX_MINUTES);
}

export function formatStayDurationMinutes(value: unknown): string {
  return String(clampStayDurationMinutes(value));
}

/** 접힌 체류 시간 토글에 표시할 한 줄 요약. `null`/`undefined` 는 미설정, `0` 은 명시적 0분 체류. */
export function formatScheduleStaySummary(
  startTime: string,
  durationMinutes: number | null | undefined,
): string {
  const hm = normalizeStartTimeToHm(startTime);
  const hasDur = typeof durationMinutes === "number" && Number.isFinite(durationMinutes);
  const dur = hasDur ? clampStayDurationMinutes(durationMinutes) : null;
  if (!hm && dur === null) return "";
  if (!hm) return `${dur}분`;
  if (dur === null) return hm;
  return `${hm} · ${dur}분`;
}

/** `HH:mm` (24시제) 을 `h:mm AM/PM` 으로 변환. */
function hmToTwelveHourWithPeriod(hm: string): string {
  const [hStr, mStr = "00"] = hm.split(":");
  const h24 = parseInt(hStr ?? "0", 10);
  if (!Number.isFinite(h24)) return hm;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${mStr} ${period}`;
}

/** 시작 ~ 종료 시간 range 표시용 (AM/PM). 체류가 명시적 0 이면 `"9:00 AM~"` 형식으로 표시. */
export function formatScheduleTimeRange(
  startTime: string,
  durationMinutes: number | null | undefined,
): string {
  const hm = normalizeStartTimeToHm(startTime);
  if (!hm) return "";
  const hasDur = typeof durationMinutes === "number" && Number.isFinite(durationMinutes);
  const startFmt = hmToTwelveHourWithPeriod(hm);
  if (!hasDur) return startFmt;
  const dur = clampStayDurationMinutes(durationMinutes);
  if (dur === 0) return `${startFmt}~`;
  const endFmt = hmToTwelveHourWithPeriod(addMinutesToHm(hm, dur));
  return `${startFmt} – ${endFmt}`;
}

/** API `startTime`을 `<input type="time">`용 `HH:mm`으로 바꿈. 미설정·공백·파싱 불가면 `""`. */
export function normalizeStartTimeToHm(value: string): string {
  const v = value.trim();
  if (!v) return "";
  const hm = /^(\d{1,2}):(\d{2})(?::\d{2})?/.exec(v);
  if (hm) {
    const h = Math.min(23, Math.max(0, parseInt(hm[1], 10)));
    const m = Math.min(59, Math.max(0, parseInt(hm[2], 10)));
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return "";
}

export function hmToMinutesSinceMidnight(hm: string): number | null {
  const n = normalizeStartTimeToHm(hm);
  if (!n) return null;
  const [hStr, mStr] = n.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** 0..1439 분을 같은 날 기준 `HH:mm`으로. */
export function minutesSinceMidnightToHm(totalMinutes: number): string {
  const wrapped =
    ((totalMinutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** `HH:mm`(또는 `normalizeStartTimeToHm` 가능한 문자열)에 분을 더한 같은 날 래핑 결과. 입력이 빈 문자열이면 분만 적용합니다. */
export function addMinutesToHm(hm: string, minutesToAdd: number): string {
  if (!Number.isFinite(minutesToAdd)) minutesToAdd = 0;
  const base = hmToMinutesSinceMidnight(hm);
  if (base === null) {
    return minutesSinceMidnightToHm(minutesToAdd);
  }
  return minutesSinceMidnightToHm(base + minutesToAdd);
}
