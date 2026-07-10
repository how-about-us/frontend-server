export const ROOM_TRIP_TITLE_MAX_LENGTH = 20;

export const TRIP_DATE_INPUT_CLASS =
  "relative w-full cursor-pointer border-0 bg-transparent p-0 pl-7 text-[17px] outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:text-inherit";

export const TRIP_FORM_FIELD_CLASS =
  "rounded-2xl border-2 border-gray-border bg-white px-5 py-4 transition focus-within:border-brand-red";

export const TRIP_FORM_FIELD_READ_ONLY_CLASS =
  "rounded-2xl border-2 border-gray-border bg-bubble-gray/30 px-5 py-4";

export const TRIP_DATE_RANGE_INVALID_MESSAGE =
  "종료일은 시작일 이후여야 해요." as const;

export const TRIP_START_BEFORE_MIN_MESSAGE =
  "시작일은 최초 여행 시작일 이전으로 바꿀 수 없어요." as const;

/** 종료일 date input `min` — floor 이전·시작일 이전 선택 방지 */
export function tripEndDateMinYmd(startDate: string, floorYmd: string): string {
  const floor = floorYmd.trim();
  if (!floor) return startDate.trim();
  if (startDate.trim() && startDate > floor) return startDate;
  return floor;
}

export function isTripStartBeforeMin(
  startDate: string,
  minYmd: string,
): boolean {
  const min = minYmd.trim();
  return Boolean(min && startDate.trim() && startDate < min);
}

export type RoomTripFormSource = {
  id: string;
  title: string;
  destinations: string[];
  startDate: string | null;
  endDate: string | null;
};

export type TripFormValues = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
};

export function toTripFormValues(source: RoomTripFormSource): TripFormValues {
  return {
    title: source.title,
    destination: source.destinations[0] ?? "",
    startDate: source.startDate ?? "",
    endDate: source.endDate ?? "",
  };
}

export function initialDestinationPlaceId(
  destination: string,
): string | null {
  return destination.trim() ? "saved" : null;
}

/** 목록 선택 전에는 제출·적용 불가 — 기존 저장값과 같으면 placeId 없이도 허용 */
export function isTripDestinationValid(
  destination: string,
  savedDestination: string,
  destinationPlaceId: string | null,
): boolean {
  const trimmed = destination.trim();
  if (!trimmed) return false;
  if (trimmed === savedDestination.trim()) return true;
  return destinationPlaceId !== null;
}

export function isTripDateRangeInvalid(startDate: string, endDate: string) {
  return Boolean(startDate && endDate && endDate < startDate);
}
