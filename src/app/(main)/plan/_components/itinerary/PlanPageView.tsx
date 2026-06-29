"use client";

import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import {
  useCreateRoomSchedule,
  useDeleteRoomSchedule,
  useRoomSchedules,
} from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";
import { usePlanItineraryExpandedStore } from "@/stores/plan-itinerary-expanded-store";

import {
  dayNumberForInsertAfterDayIndex,
  mergeSchedulesWithPlaces,
  sortRoomSchedules,
} from "@/lib/plan/scheduleMerge";
import {
  pageToolbarButtonCompactGapClass,
  pageToolbarButtonCompactIconClass,
  pageToolbarButtonCompactIconStroke,
  pageToolbarButtonCompactPaddingClass,
  pageToolbarButtonCompactTextClass,
} from "@/components/layout/page-toolbar-button";
import { cn } from "@/lib/utils";
import { MAIN_CARD_INNER_PADDING_X_CLASS } from "@/lib/layout-tokens";
import { MainPageHeader } from "@/components/layout/MainPageHeader";

import { usePlanScheduleDayReorder } from "@/hooks/usePlanScheduleDayReorder";
import { usePlanMobileReadOnly } from "@/hooks/usePlanMobileReadOnly";
import { PlanContainerRefProvider } from "../plan-container";
import { PlanScheduleDayBlock } from "./PlanScheduleDayBlock";

export function PlanPageView() {
  const { isReadOnly, copy } = usePlanMobileReadOnly();
  const planContainerRef = useRef<HTMLDivElement>(null);
  const storedId = useSessionStore((s) => s.currentRoomId);
  const roomId =
    typeof storedId === "string" && storedId.trim().length > 0
      ? storedId.trim()
      : "";

  const roomIdForQueries = roomId.length > 0 ? roomId : null;

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

  const { getSectionProps, listContainerProps, isMovePending } =
    usePlanScheduleDayReorder({
      roomId,
      schedules: sortedSchedules,
      interactionLocked: isReadOnly || isCreatingSchedule || isDeletingSchedule,
    });

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

  const handleDeleteScheduleDay = useCallback(
    (dayIndex: number) => {
      if (!roomId.length) return;
      if (isDeletingSchedule) return;
      const sid = sortedSchedules[dayIndex]?.scheduleId;
      if (sid == null) return;

      const isLastScheduleDay = sortedSchedules.length === 1;
      const confirmMessage = isLastScheduleDay
        ? "마지막 일차는 삭제할 수 없어요. 일차의 장소 목록만 비워질까요?"
        : "이 일차를 삭제할까요?";
      if (!confirm(confirmMessage)) return;

      deleteSchedule({ roomId, scheduleId: sid });
    },
    [deleteSchedule, isDeletingSchedule, roomId, sortedSchedules],
  );

  const handleAddSchedule = useCallback(() => {
    if (!roomId.length) return;
    if (isCreatingSchedule) return;
    void createScheduleAsync({ roomId, body: {} }).catch((e) => {
      toast.error(
        e instanceof Error && e.message.trim()
          ? e.message
          : "일차를 추가하지 못했어요.",
      );
    });
  }, [createScheduleAsync, isCreatingSchedule, roomId]);

  const handleInsertScheduleAfter = useCallback(
    (dayIndex: number) => {
      if (!roomId.length) return;
      if (isCreatingSchedule) return;
      const dayNumber = dayNumberForInsertAfterDayIndex(dayIndex);
      void createScheduleAsync({ roomId, body: { dayNumber } }).catch((e) => {
        toast.error(
          e instanceof Error && e.message.trim()
            ? e.message
            : "일차를 추가하지 못했어요.",
        );
      });
    },
    [createScheduleAsync, isCreatingSchedule, roomId],
  );

  const showInitialLoading = Boolean(
    roomId.length > 0 && isPending && schedules === undefined,
  );

  const canAddSchedule =
    roomId.length > 0 && !isCreatingSchedule && !isMovePending;

  const pageContentClassName =
    "@container/plan space-y-2.5 overflow-x-auto pb-8";

  const pageHeader = <MainPageHeader title="일정" />;

  const scheduleToolbar = (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={handleAddSchedule}
        disabled={!canAddSchedule}
        className={cn(
          "flex cursor-pointer items-center rounded-full bg-brand-red text-white shadow-sm transition-opacity hover:opacity-95 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
          pageToolbarButtonCompactGapClass,
          pageToolbarButtonCompactTextClass,
          pageToolbarButtonCompactPaddingClass,
        )}
      >
        <Plus
          className={pageToolbarButtonCompactIconClass}
          strokeWidth={pageToolbarButtonCompactIconStroke}
          aria-hidden
        />
        새 일차 추가
      </button>
    </div>
  );

  if (showInitialLoading) {
    return (
      <PlanContainerRefProvider containerRef={planContainerRef}>
        <div
          ref={planContainerRef}
          className={pageContentClassName}
        >
          {pageHeader}
          {!isReadOnly ? scheduleToolbar : null}
          <p className="py-8 text-center text-sm text-dark-gray">
            일정을 불러오는 중…
          </p>
        </div>
      </PlanContainerRefProvider>
    );
  }

  return (
    <PlanContainerRefProvider containerRef={planContainerRef}>
      <div
        ref={planContainerRef}
        className={pageContentClassName}
      >
        {pageHeader}
        {!isReadOnly ? scheduleToolbar : null}

        {isError ? (
          <p
            className={cn(
              "rounded-xl border border-gray-border bg-white py-3 text-sm text-brand-red",
              MAIN_CARD_INNER_PADDING_X_CLASS,
            )}
          >
            일정 목록을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.
          </p>
        ) : null}

        {!isError && planDays.length === 0 ? (
          <p
            className={cn(
              "rounded-xl border border-gray-border bg-white py-3 text-sm text-dark-gray",
              MAIN_CARD_INNER_PADDING_X_CLASS,
            )}
          >
            {copy.scheduleEmpty}
          </p>
        ) : null}

        {planDays.length > 0 ? (
          <div className="space-y-2.5" {...listContainerProps}>
            {planDays.map((day, dayIndex) => {
              const sectionProps = !isReadOnly
                ? getSectionProps(dayIndex)
                : {};

              return (
                <PlanScheduleDayBlock
                  key={day.id}
                  roomId={roomId}
                  scheduleId={sortedSchedules[dayIndex]!.scheduleId}
                  title={day.dayLabel}
                  subtitle={day.dateLabel}
                  onRequestDeleteSchedule={
                    !isReadOnly && sortedSchedules[dayIndex]
                      ? () => handleDeleteScheduleDay(dayIndex)
                      : undefined
                  }
                  onRequestInsertScheduleAfter={
                    !isReadOnly && sortedSchedules[dayIndex]
                      ? () => handleInsertScheduleAfter(dayIndex)
                      : undefined
                  }
                  isScheduleMenuDisabled={
                    isCreatingSchedule || isDeletingSchedule || isMovePending
                  }
                  interactionLocked={
                    isReadOnly || isCreatingSchedule || isDeletingSchedule
                  }
                  {...sectionProps}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </PlanContainerRefProvider>
  );
}
