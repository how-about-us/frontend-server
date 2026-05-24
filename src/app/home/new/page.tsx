"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";

import { BrandLogo } from "@/components/BrandLogo";

import { useCreateRoom } from "@/hooks/useRooms";
import {
  formatDateYmd,
  isTripDurationWithinLimit,
  MAX_TRIP_DAYS,
} from "@/lib/plan/tripRange";
import { cn } from "@/lib/utils";
import { useSessionStore } from "@/stores/session-store";
import { DestinationSearchInput } from "@/components/search/DestinationSearchInput";

const TITLE_MAX_LENGTH = 20;

const DATE_INPUT_CLASS =
  "relative w-full cursor-pointer border-0 bg-transparent p-0 pl-7 text-sm outline-none [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:left-0 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-datetime-edit]:text-inherit";

type DateFieldProps = {
  id: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
};

function DateField({ id, value, min, onChange }: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = (e: React.MouseEvent) => {
    e.preventDefault();
    inputRef.current?.showPicker?.();
  };

  return (
    <label
      htmlFor={id}
      onClick={openPicker}
      className="relative flex flex-1 cursor-pointer items-center"
    >
      <input
        id={id}
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        className={cn(
          DATE_INPUT_CLASS,
          value ? "text-dark-gray" : "text-light-gray",
        )}
      />
    </label>
  );
}

export default function NewTripPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationPlaceId, setDestinationPlaceId] = useState<string | null>(
    null,
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);
  const setCurrentRoomInviteCode = useSessionStore(
    (s) => s.setCurrentRoomInviteCode,
  );
  const { mutate: createRoom, isPending, error } = useCreateRoom();

  const todayYmd = formatDateYmd(new Date());
  const endDateMin = startDate && startDate > todayYmd ? startDate : todayYmd;

  const dateRangeInvalid = Boolean(startDate && endDate && endDate < startDate);

  const tripDurationInvalid = Boolean(
    startDate &&
    endDate &&
    !dateRangeInvalid &&
    !isTripDurationWithinLimit(startDate, endDate),
  );

  const canSubmit =
    title.trim() &&
    destination.trim() &&
    destinationPlaceId &&
    startDate &&
    endDate &&
    !isPending &&
    !dateRangeInvalid &&
    !tripDurationInvalid;

  const handleSubmit = () => {
    if (!canSubmit || dateRangeInvalid || tripDurationInvalid) return;

    createRoom(
      {
        title: title.trim().slice(0, TITLE_MAX_LENGTH),
        destination: destination.trim(),
        startDate,
        endDate,
      },
      {
        onSuccess: (room) => {
          setCurrentRoomId(room.id);
          setCurrentRoomInviteCode(room.inviteCode);
          router.push("/plan");
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-10 flex justify-center">
          <Link
            href="/home"
            className="inline-flex rounded-md outline-none ring-offset-2 transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-brand-red"
          >
            <BrandLogo alt="로고" style={{ width: 116, height: 66 }} />
          </Link>
        </div>

        <h1 className="mb-8 text-center text-2xl font-bold tracking-tight text-black">
          새로운 여행 계획하기
        </h1>

        <div className="space-y-3">
          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 transition focus-within:border-brand-red">
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="text-sm font-bold text-black">여행 제목</p>
              <p className="shrink-0 text-xs tabular-nums text-light-gray">
                {title.length}/{TITLE_MAX_LENGTH}
              </p>
            </div>
            <input
              type="text"
              value={title}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(e) =>
                setTitle(e.target.value.slice(0, TITLE_MAX_LENGTH))
              }
              placeholder="예: 봄 일본 여행, 하와이 신혼여행"
              className="w-full text-sm text-dark-gray outline-none placeholder:text-light-gray"
              autoFocus
            />
          </div>

          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 transition focus-within:border-brand-red">
            <p className="mb-1.5 text-sm font-bold text-black">목적지</p>
            <DestinationSearchInput
              value={destination}
              onChange={setDestination}
              onResolvedPlace={(place) =>
                setDestinationPlaceId(place?.placeId ?? null)
              }
              selectionOnly
              leadingIconType="search"
            />
          </div>

          <div className="rounded-2xl border-2 border-gray-border bg-white px-5 py-4 transition focus-within:border-brand-red">
            <p className="mb-1.5 text-sm font-bold text-black">날짜</p>
            <div className="flex items-center gap-3">
              <DateField
                id="trip-start-date"
                value={startDate}
                min={todayYmd}
                onChange={setStartDate}
              />
              <span className="select-none text-light-gray">|</span>
              <DateField
                id="trip-end-date"
                value={endDate}
                min={endDateMin}
                onChange={setEndDate}
              />
            </div>
            {dateRangeInvalid && (
              <p className="mt-2 text-xs text-brand-red">
                종료일은 시작일 이후여야 해요.
              </p>
            )}
            {tripDurationInvalid && (
              <p className="mt-2 text-xs text-brand-red">
                여행 기간은 최대 {MAX_TRIP_DAYS}일까지예요.
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-sm text-brand-red">
            {error instanceof Error
              ? error.message
              : "방 생성에 실패했어요. 다시 시도해주세요."}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-8 w-full rounded-full bg-brand-red py-4 text-base font-semibold text-white shadow transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "생성 중…" : "계획을 시작하세요"}
        </button>

        <Link
          href="/home"
          className="mt-4 block text-center text-sm font-medium text-dark-gray underline-offset-4 transition hover:text-neutral-900 hover:underline"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
