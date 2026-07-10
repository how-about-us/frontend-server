"use client";

import { DestinationSearchInput } from "@/components/search/DestinationSearchInput";
import {
  isTripScheduleDayLimitExceeded,
  TRIP_SCHEDULE_DAY_LIMIT_MESSAGE,
} from "@/lib/plan/schedulePolicy";
import {
  isTripDateRangeInvalid,
  isTripStartBeforeMin,
  ROOM_TRIP_TITLE_MAX_LENGTH,
  TRIP_DATE_RANGE_INVALID_MESSAGE,
  TRIP_FORM_FIELD_CLASS,
  TRIP_FORM_FIELD_READ_ONLY_CLASS,
  TRIP_START_BEFORE_MIN_MESSAGE,
  type TripFormValues,
} from "@/lib/rooms/trip-form";

import { TripDateField } from "./TripDateField";

type Props = {
  idPrefix: string;
  values: TripFormValues;
  readOnly?: boolean;
  autoFocusTitle?: boolean;
  startDateMin?: string;
  endDateMin?: string;
  onTitleChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onDestinationResolved?: (placeId: string | null) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
};

export function TripFormFields({
  idPrefix,
  values,
  readOnly = false,
  autoFocusTitle = false,
  startDateMin,
  endDateMin,
  onTitleChange,
  onDestinationChange,
  onDestinationResolved,
  onStartDateChange,
  onEndDateChange,
}: Props) {
  const { title, destination, startDate, endDate } = values;
  const dateRangeInvalid = isTripDateRangeInvalid(startDate, endDate);
  const startBeforeMin =
    startDateMin != null && isTripStartBeforeMin(startDate, startDateMin);
  const scheduleDayLimitExceeded = isTripScheduleDayLimitExceeded(
    startDate,
    endDate,
  );
  const fieldClassName = readOnly
    ? TRIP_FORM_FIELD_READ_ONLY_CLASS
    : TRIP_FORM_FIELD_CLASS;

  return (
    <div className="min-w-0 space-y-3">
      <div className={fieldClassName}>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className="text-[17px] font-bold text-black">여행 제목</p>
          {!readOnly && (
            <p className="shrink-0 text-[14px] tabular-nums text-light-gray">
              {title.length}/{ROOM_TRIP_TITLE_MAX_LENGTH}
            </p>
          )}
        </div>
        {readOnly ? (
          <p className="text-[17px] text-dark-gray">{title.trim() || "—"}</p>
        ) : (
          <input
            type="text"
            value={title}
            maxLength={ROOM_TRIP_TITLE_MAX_LENGTH}
            onChange={(e) =>
              onTitleChange(e.target.value.slice(0, ROOM_TRIP_TITLE_MAX_LENGTH))
            }
            placeholder="예: 봄 일본 여행, 하와이 신혼여행"
            className="w-full text-[17px] text-dark-gray outline-none placeholder:text-light-gray"
            autoFocus={autoFocusTitle}
          />
        )}
      </div>

      <div className={fieldClassName}>
        <p className="mb-1.5 text-[17px] font-bold text-black">목적지</p>
        {readOnly ? (
          <p className="text-[17px] text-dark-gray">{destination.trim() || "—"}</p>
        ) : (
          <DestinationSearchInput
            value={destination}
            onChange={onDestinationChange}
            onResolvedPlace={(place) =>
              onDestinationResolved?.(place?.placeId ?? null)
            }
            selectionOnly
            leadingIconType="search"
          />
        )}
      </div>

      <div className={fieldClassName}>
        <p className="mb-1.5 text-[17px] font-bold text-black">날짜</p>
        <div className="flex min-w-0 items-center gap-3">
          <TripDateField
            id={`${idPrefix}-start`}
            value={startDate}
            min={startDateMin}
            onChange={onStartDateChange}
            readOnly={readOnly}
          />
          <span className="shrink-0 select-none text-light-gray">|</span>
          <TripDateField
            id={`${idPrefix}-end`}
            value={endDate}
            min={endDateMin}
            onChange={onEndDateChange}
            readOnly={readOnly}
          />
        </div>
        {!readOnly && startBeforeMin && (
          <p className="mt-2 text-[14px] text-brand-red">
            {TRIP_START_BEFORE_MIN_MESSAGE}
          </p>
        )}
        {!readOnly && !startBeforeMin && dateRangeInvalid && (
          <p className="mt-2 text-[14px] text-brand-red">
            {TRIP_DATE_RANGE_INVALID_MESSAGE}
          </p>
        )}
        {!readOnly &&
          !startBeforeMin &&
          !dateRangeInvalid &&
          scheduleDayLimitExceeded && (
          <p className="mt-2 text-[14px] text-brand-red">
            {TRIP_SCHEDULE_DAY_LIMIT_MESSAGE}
          </p>
        )}
      </div>
    </div>
  );
}
