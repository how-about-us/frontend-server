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

/** 방 여행 기간 안에서 아직 schedule이 없는 첫 날 — 서버 기대와 동일한 date·dayNumber */
export function nextUnusedTripSchedulePayload(
  startYmd: string,
  endYmd: string,
  existingDates: ReadonlySet<string> | readonly string[],
): { dayNumber: number; date: string } | null {
  const used =
    existingDates instanceof Set ? existingDates : new Set(existingDates);
  const next = eachInclusiveTripDay(startYmd, endYmd).find(
    (d) => !used.has(d.date),
  );
  return next ? { dayNumber: next.dayNumber, date: next.date } : null;
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

/** `YYYY-MM-DD` 둘 중 이른 날 / 늦은 날 */
export function minYmd(a: string, b: string): string {
  return a.localeCompare(b) <= 0 ? a : b;
}

export function maxYmd(a: string, b: string): string {
  return a.localeCompare(b) >= 0 ? a : b;
}

/**
 * 방 메타의 여행 시작·종료와 일정에 포함된 날짜들을 합쳐 UI 표시용 구간을 만듭니다.
 */
export function tripBoundsMergedWithScheduleDates(
  roomStartYmd: string,
  roomEndYmd: string,
  scheduleDatesYmd: readonly string[],
): { startYmd: string; endYmd: string } {
  if (scheduleDatesYmd.length === 0) {
    return { startYmd: roomStartYmd, endYmd: roomEndYmd };
  }
  let minD = scheduleDatesYmd[0]!;
  let maxD = scheduleDatesYmd[0]!;
  for (let i = 1; i < scheduleDatesYmd.length; i++) {
    const d = scheduleDatesYmd[i]!;
    minD = minYmd(minD, d);
    maxD = maxYmd(maxD, d);
  }
  return {
    startYmd: minYmd(roomStartYmd, minD),
    endYmd: maxYmd(roomEndYmd, maxD),
  };
}

/** 홈 카드·헤더 등: `YYYY-MM-DD` 범위를 짧은 한글 문구로 */
export function formatTripYmdRangeShortKo(startYmd: string, endYmd: string): string {
  const fmt = (ymd: string) => {
    const date = new Date(ymd);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };
  if (!startYmd && !endYmd) return "";
  if (startYmd === endYmd) return fmt(startYmd);
  return `${fmt(startYmd)} – ${fmt(endYmd)}`;
}

export type RoomTripYmdSource = {
  id: string;
  startDate: string;
  endDate: string;
};

/** 참여 중인 방 목록 또는 세션 메타에서 여행 `YYYY-MM-DD` 경계를 고릅니다. */
export function tripYmdBoundsFromRoomSources(
  roomId: string,
  listRooms: RoomTripYmdSource[] | undefined,
  detailFallback: RoomTripYmdSource | null | undefined,
): { startYmd: string; endYmd: string } {
  if (!roomId.length) return { startYmd: "", endYmd: "" };
  const fromList = listRooms?.find((r) => r.id === roomId);
  if (fromList?.startDate && fromList?.endDate) {
    return { startYmd: fromList.startDate, endYmd: fromList.endDate };
  }
  if (
    detailFallback?.id === roomId &&
    detailFallback.startDate &&
    detailFallback.endDate
  ) {
    return {
      startYmd: detailFallback.startDate,
      endYmd: detailFallback.endDate,
    };
  }
  return { startYmd: "", endYmd: "" };
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
