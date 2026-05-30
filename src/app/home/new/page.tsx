"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { TripFormFields } from "@/components/rooms/TripFormFields";

import { useRedirectOnMobileDevice } from "@/hooks/useMobileRedirects";
import { useCreateRoom } from "@/hooks/useRooms";
import type { RoomDetail } from "@/lib/api/rooms";
import { formatDateYmd } from "@/lib/plan/tripRange";
import {
  isTripDateRangeInvalid,
  ROOM_TRIP_TITLE_MAX_LENGTH,
} from "@/lib/rooms/trip-form";
import { roomDetailQueryKey } from "@/lib/query-keys";
import { useSessionStore } from "@/stores/session-store";

export default function NewTripPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  useRedirectOnMobileDevice("/home");
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationPlaceId, setDestinationPlaceId] = useState<string | null>(
    null,
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);
  const { mutate: createRoom, isPending, error } = useCreateRoom();

  const todayYmd = formatDateYmd(new Date());
  const endDateMin = startDate && startDate > todayYmd ? startDate : todayYmd;
  const dateRangeInvalid = isTripDateRangeInvalid(startDate, endDate);

  const canSubmit =
    title.trim() &&
    destination.trim() &&
    destinationPlaceId &&
    startDate &&
    endDate &&
    !isPending &&
    !dateRangeInvalid;

  const handleSubmit = () => {
    if (!canSubmit || dateRangeInvalid) return;

    createRoom(
      {
        title: title.trim().slice(0, ROOM_TRIP_TITLE_MAX_LENGTH),
        destination: destination.trim(),
        startDate,
        endDate,
      },
      {
        onSuccess: (room) => {
          setCurrentRoomId(room.id);
          queryClient.setQueryData<RoomDetail>(
            roomDetailQueryKey(room.id),
            room,
          );
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

        <TripFormFields
          idPrefix="new-trip"
          values={{ title, destination, startDate, endDate }}
          autoFocusTitle
          startDateMin={todayYmd}
          endDateMin={endDateMin}
          onTitleChange={setTitle}
          onDestinationChange={setDestination}
          onDestinationResolved={setDestinationPlaceId}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

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
