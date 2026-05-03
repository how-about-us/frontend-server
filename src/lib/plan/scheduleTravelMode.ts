/** 일정 구간(이전 장소 → 이 항목) 이동 수단 — API `travelMode` 값과 맞춥니다. */
export const SCHEDULE_TRAVEL_MODES = [
  { value: "WALK", label: "도보" },
  { value: "TRANSIT", label: "대중교통" },
  { value: "DRIVING", label: "자동차" },
  { value: "CYCLING", label: "자전거" },
] as const;

export type ScheduleTravelModeValue =
  (typeof SCHEDULE_TRAVEL_MODES)[number]["value"];

export function scheduleTravelModeLabel(mode: string): string {
  const row = SCHEDULE_TRAVEL_MODES.find((m) => m.value === mode);
  return row?.label ?? mode;
}
