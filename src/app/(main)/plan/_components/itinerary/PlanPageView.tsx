"use client";

import { useCallback, useLayoutEffect, useMemo } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import {
  useCreateRoomSchedule,
  useDeleteRoomSchedule,
  useRoomSchedules,
  useRoomsList,
} from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";
import { usePlanItineraryExpandedStore } from "@/stores/plan-itinerary-expanded-store";

import {
  mergeSchedulesWithPlaces,
  sortRoomSchedules,
} from "@/lib/plan/scheduleMerge";
import {
  nextUnusedTripSchedulePayload,
  tripYmdBoundsFromRoomSources,
} from "@/lib/plan/tripRange";

import { PlanChatSectionWidth } from "../chat/PlanChatSectionWidth";
import { PlanDaySection } from "./PlanDaySection";
import { PlanItinerary } from "./PlanItinerary";

export function PlanPageView() {
  const storedId = useSessionStore((s) => s.currentRoomId);
  const roomMeta = useSessionStore((s) => s.currentRoomMeta);
  const roomId =
    typeof storedId === "string" && storedId.trim().length > 0
      ? storedId.trim()
      : "";

  const roomIdForQueries = roomId.length > 0 ? roomId : null;

  const { data: roomsData } = useRoomsList();

  const {
    data: schedules,
    isPending,
    isError,
  } = useRoomSchedules(roomIdForQueries);
  const { mutate: deleteSchedule, isPending: isDeletingSchedule } =
    useDeleteRoomSchedule();
  const { mutateAsync: createScheduleAsync, isPending: isCreatingSchedule } =
    useCreateRoomSchedule();

  const scheduleList = useMemo(() => schedules ?? [], [schedules]);
  const sortedSchedules = useMemo(
    () => sortRoomSchedules(scheduleList),
    [scheduleList],
  );

  const tripRange = useMemo(
    () => tripYmdBoundsFromRoomSources(roomId, roomsData?.rooms, roomMeta),
    [roomId, roomsData?.rooms, roomMeta],
  );

  const nextScheduleBody = useMemo(() => {
    const { startYmd, endYmd } = tripRange;
    if (!startYmd || !endYmd) return null;
    return nextUnusedTripSchedulePayload(
      startYmd,
      endYmd,
      sortedSchedules.map((s) => s.date),
    );
  }, [tripRange, sortedSchedules]);

  const scheduleExpansionSyncKey = useMemo(
    () => sortedSchedules.map((s) => s.scheduleId).join(","),
    [sortedSchedules],
  );

  useLayoutEffect(() => {
    const ids =
      scheduleExpansionSyncKey.length > 0
        ? scheduleExpansionSyncKey
            .split(",")
            .map(Number)
            .filter(Number.isFinite)
        : [];
    usePlanItineraryExpandedStore.getState().syncScheduleExpansionState(ids);
  }, [scheduleExpansionSyncKey]);

  const planDays = useMemo(
    () =>
      scheduleList.length > 0 ? mergeSchedulesWithPlaces(scheduleList) : [],
    [scheduleList],
  );

  const lastDayIndex =
    sortedSchedules.length > 0 ? sortedSchedules.length - 1 : -1;

  const handleDeleteScheduleDay = useCallback(
    (dayIndex: number) => {
      if (!roomId.length) return;
      if (isDeletingSchedule) return;
      if (dayIndex !== lastDayIndex) return;
      const sid = sortedSchedules[dayIndex]?.scheduleId;
      if (sid == null) return;
      deleteSchedule(
        { roomId, scheduleId: sid },
        {
          onError: () => {
            toast.error("일정을 삭제하지 못했어요.");
          },
        },
      );
    },
    [
      deleteSchedule,
      isDeletingSchedule,
      lastDayIndex,
      roomId,
      sortedSchedules,
    ],
  );

  const handleAddSchedule = useCallback(() => {
    if (!roomId.length) return;
    if (isCreatingSchedule) return;
    const { startYmd, endYmd } = tripRange;
    if (!startYmd || !endYmd) {
      toast.error("여행 기간을 불러오지 못했어요.");
      return;
    }
    const body = nextScheduleBody;
    if (!body) {
      toast.error(
        "여행 기간 안에 더 추가할 일차가 없어요. 설정에서 여행 기간을 늘린 뒤 다시 시도해 주세요.",
      );
      return;
    }
    void createScheduleAsync({ roomId, body }).catch(() => {
      toast.error("일차를 추가하지 못했어요.");
    });
  }, [
    createScheduleAsync,
    isCreatingSchedule,
    nextScheduleBody,
    roomId,
    tripRange.endYmd,
    tripRange.startYmd,
  ]);

  const showInitialLoading = Boolean(
    roomId.length > 0 && isPending && schedules === undefined,
  );

  const hasTripBounds = Boolean(tripRange.startYmd && tripRange.endYmd);
  const canAddSchedule =
    roomId.length > 0 &&
    hasTripBounds &&
    Boolean(nextScheduleBody) &&
    !isCreatingSchedule &&
    !showInitialLoading;

  const scheduleToolbar = (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={handleAddSchedule}
        disabled={!canAddSchedule}
        aria-label="일차 추가"
        className="inline-flex items-center justify-center rounded-xl border border-gray-border bg-white p-2.5 text-gray-900 shadow-sm transition-colors hover:bg-bubble-gray/60 disabled:pointer-events-none disabled:opacity-50"
      >
        <Plus className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );

  if (showInitialLoading) {
    return (
      <div className="space-y-3 pl-6 pr-6">
        {scheduleToolbar}
        <PlanChatSectionWidth />
        <p className="py-8 text-center text-sm text-dark-gray">
          일정을 불러오는 중…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pl-6 pr-6">
      {scheduleToolbar}

      <PlanChatSectionWidth />

      {isError ? (
        <p className="rounded-xl border border-gray-border bg-white px-4 py-3 text-sm text-brand-red">
          일정 목록을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.
        </p>
      ) : null}

      {!isError && planDays.length === 0 ? (
        <p className="rounded-xl border border-gray-border bg-white px-4 py-3 text-sm text-dark-gray">
          아직 생성된 일정이 없어요. 우측 상단의 더하기(+) 버튼으로 일차를
          추가해 보세요.
        </p>
      ) : null}

      {planDays.map((day, dayIndex) => (
        <PlanDaySection
          key={day.id}
          title={day.dayLabel}
          subtitle={day.dateLabel}
          itineraryScheduleId={sortedSchedules[dayIndex]?.scheduleId ?? null}
          onRequestDeleteSchedule={
            sortedSchedules[dayIndex] && dayIndex === lastDayIndex ?
              () => handleDeleteScheduleDay(dayIndex)
            : undefined
          }
        >
          {sortedSchedules[dayIndex] ? (
            <PlanItinerary
              roomId={roomId}
              scheduleId={sortedSchedules[dayIndex].scheduleId}
            />
          ) : null}
        </PlanDaySection>
      ))}
    </div>
  );
}
