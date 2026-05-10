import { hmToMinutesSinceMidnight, normalizeStartTimeToHm } from "@/lib/plan/scheduleTime";
import type { PlanPlace } from "@/lib/plan/types";

function startMinutesForPlace(place: PlanPlace): number | null {
  const raw = place.startTime?.trim() ?? "";
  if (!raw) return null;
  return hmToMinutesSinceMidnight(normalizeStartTimeToHm(raw));
}

function durationMinutesForPlace(place: PlanPlace): number {
  const d = place.durationMinutes;
  if (typeof d !== "number" || !Number.isFinite(d) || d < 0) return 0;
  return Math.floor(d);
}

export type AdjacentScheduleConflictFlags = {
  /** 이 일정이 종료되기 전에 다음 일정이 시작하면 true(경고는 이 카드에만 표시) */
  overlapsNext: boolean;
};

/** 인접 항목 간 겹침: 이전 항목 종료 > 다음 항목 시작일 때, **앞쪽 항목**에만 overlapsNext로 표시 */
export function getAdjacentScheduleConflictFlags(
  places: PlanPlace[],
): AdjacentScheduleConflictFlags[] {
  const n = places.length;
  const flags: AdjacentScheduleConflictFlags[] = [];
  const starts: (number | null)[] = places.map(startMinutesForPlace);
  const durs = places.map(durationMinutesForPlace);
  const ends = starts.map((s, i) =>
    s === null ? null : s + durs[i],
  );

  for (let i = 0; i < n; i += 1) {
    const endI = ends[i];
    const startNext = i + 1 < n ? starts[i + 1] : null;

    const overlapsNext =
      endI !== null &&
      startNext !== null &&
      endI > startNext;

    flags.push({ overlapsNext });
  }
  return flags;
}

export function formatAdjacentScheduleConflictMessage(
  flags: AdjacentScheduleConflictFlags,
): string | undefined {
  if (flags.overlapsNext) return "다음 일정과 시간이 겹쳐요.";
  return undefined;
}
