"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { roomSchedulesQueryKey } from "@/lib/queryKeys/roomSchedules";

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

interface Props {
  /** 현재 방 ID — 향후 API 호출 시 queryKey 등에 사용 */
  roomId: string;
}

export function PlanPageView({ roomId }: Props) {
  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);
  useEffect(() => {
    setCurrentRoomId(roomId);
  }, [roomId, setCurrentRoomId]);

  const queryClient = useQueryClient();
  const { data: schedules, isPending, isError } = useRoomSchedules(roomId);
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
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: roomSchedulesQueryKey(roomId.trim()),
      });
      queryClient.invalidateQueries({
        queryKey: ["schedule-items", roomId.trim()],
      });
    },
  });

  /** 서버 일정이 없을 때만 기간 선택 UI용 (적용 시 POST로 일정 생성) */
  const [draftRange, setDraftRange] = useState(INITIAL_RANGE);

  const scheduleList = useMemo(() => schedules ?? [], [schedules]);
  const serverDriven = scheduleList.length > 0;
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

  const showInitialLoading = isPending && schedules === undefined;

  const handleRangeApply = useCallback(
    async (start: Date, end: Date) => {
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
    [scheduleList, syncSchedulesToRange],
  );

  const rangeToolbarProps = {
    rangeStart: toolbarRangeStart,
    rangeEnd: toolbarRangeEnd,
    onRangeApply: handleRangeApply,
  };

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
