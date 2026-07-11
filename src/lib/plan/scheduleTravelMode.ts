/** 일정 구간(이전 장소 → 이 항목) 이동 수단 — 서버: `WALKING`, `DRIVING`, `BICYCLING`, `TRANSIT` */
export const SCHEDULE_TRAVEL_MODES = [
  { value: "WALKING", label: "도보" },
  { value: "TRANSIT", label: "대중교통" },
  { value: "DRIVING", label: "자동차" },
  { value: "BICYCLING", label: "자전거" },
] as const;

export type ScheduleTravelModeValue =
  (typeof SCHEDULE_TRAVEL_MODES)[number]["value"];

/** 서버 `schedule_items.travel_mode` 기본값 — 저장값을 아직 모를 때의 폴백 */
export const SCHEDULE_TRAVEL_MODE_DEFAULT: ScheduleTravelModeValue = "DRIVING";

const API_VALUES = new Set<string>(
  SCHEDULE_TRAVEL_MODES.map((m) => m.value),
);

/** 예전 클라이언트·데이터 호환 */
const LEGACY_ALIAS: Record<string, ScheduleTravelModeValue> = {
  WALK: "WALKING",
  CYCLING: "BICYCLING",
  WALKING: "WALKING",
  TRANSIT: "TRANSIT",
  DRIVING: "DRIVING",
  BICYCLING: "BICYCLING",
};

/**
 * API·쿼리스트링에 쓸 표준 이동 수단 코드.
 * 알 수 없으면 `null`(호출부에서 기본값 처리).
 */
export function canonicalScheduleTravelMode(
  mode: string | null | undefined,
): ScheduleTravelModeValue | null {
  const raw = typeof mode === "string" ? mode.trim() : "";
  if (!raw.length) return null;
  const upper = raw.toUpperCase();
  const fromLegacy = LEGACY_ALIAS[upper];
  if (fromLegacy) return fromLegacy;
  if (API_VALUES.has(upper))
    return upper as ScheduleTravelModeValue;
  return null;
}

export function scheduleTravelModeLabel(mode: string): string {
  const canon = canonicalScheduleTravelMode(mode);
  if (canon) {
    const row = SCHEDULE_TRAVEL_MODES.find((m) => m.value === canon);
    if (row) return row.label;
  }
  return mode;
}
