"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { TripFormFields } from "@/components/rooms/TripFormFields";
import { useUpdateRoom } from "@/hooks/useRooms";
import {
  initialDestinationPlaceId,
  isTripDateRangeInvalid,
  isTripDestinationValid,
  ROOM_TRIP_TITLE_MAX_LENGTH,
  toTripFormValues,
  type RoomTripFormSource,
} from "@/lib/rooms/trip-form";

type Props = {
  room: RoomTripFormSource;
  readOnly?: boolean;
};

export function RoomTripEditForm({ room, readOnly = false }: Props) {
  const saved = toTripFormValues(room);

  const [title, setTitle] = useState(saved.title);
  const [destination, setDestination] = useState(saved.destination);
  const [destinationPlaceId, setDestinationPlaceId] = useState<string | null>(
    initialDestinationPlaceId(saved.destination),
  );
  const [startDate, setStartDate] = useState(saved.startDate);
  const [endDate, setEndDate] = useState(saved.endDate);

  const { mutate: updateRoom, isPending, error } = useUpdateRoom();

  useEffect(() => {
    const next = toTripFormValues(room);
    setTitle(next.title);
    setDestination(next.destination);
    setDestinationPlaceId(initialDestinationPlaceId(next.destination));
    setStartDate(next.startDate);
    setEndDate(next.endDate);
  }, [
    room.id,
    room.title,
    room.destination,
    room.startDate,
    room.endDate,
  ]);

  const dateRangeInvalid = isTripDateRangeInvalid(startDate, endDate);

  const isDirty =
    title !== saved.title ||
    destination !== saved.destination ||
    startDate !== saved.startDate ||
    endDate !== saved.endDate;

  const canApply =
    title.trim() &&
    isTripDestinationValid(destination, saved.destination, destinationPlaceId) &&
    startDate &&
    endDate &&
    !dateRangeInvalid &&
    !isPending &&
    isDirty;

  function handleCancel() {
    const next = toTripFormValues(room);
    setTitle(next.title);
    setDestination(next.destination);
    setDestinationPlaceId(initialDestinationPlaceId(next.destination));
    setStartDate(next.startDate);
    setEndDate(next.endDate);
  }

  function handleApply() {
    if (!canApply) return;

    updateRoom(
      {
        roomId: room.id,
        data: {
          title: title.trim().slice(0, ROOM_TRIP_TITLE_MAX_LENGTH),
          destination: destination.trim(),
          startDate,
          endDate,
        },
      },
      {
        onSuccess: () => {
          toast.success("여행 정보가 수정되었어요");
        },
      },
    );
  }

  return (
    <div className="flex min-w-0 w-full flex-col gap-6">
      <TripFormFields
        idPrefix={`trip-${room.id}`}
        values={{ title, destination, startDate, endDate }}
        readOnly={readOnly}
        endDateMin={startDate || undefined}
        onTitleChange={setTitle}
        onDestinationChange={setDestination}
        onDestinationResolved={setDestinationPlaceId}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {error && !readOnly && (
        <p className="text-center text-sm text-brand-red">
          {error instanceof Error
            ? error.message
            : "수정에 실패했어요. 다시 시도해주세요."}
        </p>
      )}

      {!readOnly && (
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isDirty || isPending}
            className="flex-1 rounded-full border border-gray-border py-2.5 text-sm font-semibold text-dark-gray transition hover:bg-bubble-gray disabled:cursor-not-allowed disabled:opacity-40"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!canApply}
            className="flex-1 rounded-full bg-brand-red py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? "저장 중…" : "적용하기"}
          </button>
        </div>
      )}
    </div>
  );
}
