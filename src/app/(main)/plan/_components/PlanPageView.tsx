"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { useDeleteRoomSchedule, useRoomSchedules } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";

import {
  syncRoomSchedulesToDateRange,
  type RoomSchedule,
} from "@/lib/api/rooms";
import {
  mergeSchedulesWithPlaces,
  rangeFromSchedules,
  sortRoomSchedules,
} from "@/lib/plan/scheduleMerge";
import { formatDateYmd, startOfLocalDay } from "@/lib/plan/tripRange";

import { PlanChatSectionWidth } from "./PlanChatSectionWidth";
import { PlanDaySection } from "./PlanDaySection";
import { PlanItinerary } from "./PlanItinerary";
import { PlanTripRangeToolbar } from "./PlanTripRangeToolbar";

function defaultTripRange(): { start: Date; end: Date } {
  const t = startOfLocalDay(new Date());
  const e = new Date(t);
  e.setDate(e.getDate() + 2);
  return { start: t, end: e };
}

const INITIAL_RANGE = defaultTripRange();

export function PlanPageView() {
  const storedId = useSessionStore((s) => s.currentRoomId);
  const roomId =
    typeof storedId === "string" && storedId.trim().length > 0
      ? storedId.trim()
      : "";

  const roomIdForQueries = roomId.length > 0 ? roomId : null;

  const { data: schedules, isPending, isError } =
    useRoomSchedules(roomIdForQueries);
  const { mutate: deleteSchedule, isPending: isDeletingSchedule } =
    useDeleteRoomSchedule();

  const { mutateAsync: syncSchedulesToRange } = useMutation({
    mutationFn: async ({
      start,
      end,
      currentSchedules,
    }: {
      start: Date;
      end: Date;
      currentSchedules: RoomSchedule[];
    }) => {
      const s = startOfLocalDay(start);
      const e = startOfLocalDay(end);
      await syncRoomSchedulesToDateRange(
        roomId,
        formatDateYmd(s),
        formatDateYmd(e),
        currentSchedules,
      );
    },
  });

  /** 서버 일정이 없을 때만 기간 선택 UI용 (적용 시 POST로 일정 생성) */
  const [draftRange, setDraftRange] = useState(INITIAL_RANGE);

  const scheduleList = useMemo(() => schedules ?? [], [schedules]);
  const sortedSchedules = useMemo(
    () => sortRoomSchedules(scheduleList),
    [scheduleList],
  );

  const scheduleDerivedRange = useMemo(() => {
    if (!scheduleList.length) return null;
    return rangeFromSchedules(scheduleList);
  }, [scheduleList]);

  const toolbarRangeStart = scheduleDerivedRange?.start ?? draftRange.start;
  const toolbarRangeEnd = scheduleDerivedRange?.end ?? draftRange.end;

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
      deleteSchedule(
        { roomId, scheduleId: sid },
        {
          onError: () => {
            toast.error("일정을 삭제하지 못했어요.");
          },
        },
      );
    },
    [deleteSchedule, isDeletingSchedule, roomId, sortedSchedules],
  );

  const showInitialLoading = Boolean(
    roomId.length > 0 && isPending && schedules === undefined,
  );

  const handleRangeApply = useCallback(
    async (start: Date, end: Date) => {
      if (!roomId.length) return;
      const s = startOfLocalDay(start);
      const e = startOfLocalDay(end);
      try {
        await syncSchedulesToRange({
          start: s,
          end: e,
          currentSchedules: scheduleList,
        });
        setDraftRange({ start: s, end: e });
      } catch {
        toast.error("여행 기간을 서버에 반영하지 못했어요.");
        throw new Error("sync schedules failed");
      }
    },
    [roomId, scheduleList, syncSchedulesToRange],
  );

  const rangeToolbarProps = {
    rangeStart: toolbarRangeStart,
    rangeEnd: toolbarRangeEnd,
    onRangeApply: handleRangeApply,
  };

  if (!roomId.length) {
    return (
      <div className="space-y-3 pl-6 pr-6">
        <PlanTripRangeToolbar {...rangeToolbarProps} />
        <PlanChatSectionWidth />
        <p className="rounded-xl border border-gray-border bg-white px-4 py-6 text-center text-sm text-dark-gray">
          선택된 여행 방이 없어요.
          <br />
          홈에서 방을 고른 뒤 다시 들어오거나, 카드에서 일정 보기를 눌러 주세요.
        </p>
        <div className="flex justify-center">
          <Link
            href="/home"
            className="text-sm font-medium text-brand-green underline-offset-2 hover:underline"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  if (showInitialLoading) {
    return (
      <div className="space-y-3 pl-6 pr-6">
        <PlanTripRangeToolbar {...rangeToolbarProps} />
        <PlanChatSectionWidth />
        <p className="py-8 text-center text-sm text-dark-gray">
          일정을 불러오는 중…
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pl-6 pr-6">
      <PlanTripRangeToolbar {...rangeToolbarProps} />

      <PlanChatSectionWidth />

      {isError ? (
        <p className="rounded-xl border border-gray-border bg-white px-4 py-3 text-sm text-brand-red">
          일정 목록을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.
        </p>
      ) : null}

      {!isError && planDays.length === 0 ? (
        <p className="rounded-xl border border-gray-border bg-white px-4 py-3 text-sm text-dark-gray">
          아직 생성된 일정이 없어요. 위에서 여행 기간을 선택한 뒤 적용하면 서버에
          일정이 만들어집니다.
        </p>
      ) : null}

      {planDays.map((day, dayIndex) => (
        <PlanDaySection
          key={day.id}
          title={day.dayLabel}
          subtitle={day.dateLabel}
          onRequestDeleteDay={
            planDays.length > 1 && sortedSchedules[dayIndex]
              ? () => handleDeleteScheduleDay(dayIndex)
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
