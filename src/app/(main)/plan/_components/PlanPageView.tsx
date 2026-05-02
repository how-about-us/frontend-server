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
import {
  countInclusiveLocalDays,
  formatDateYmd,
  mergePlanDaysWithPlaces,
  startOfLocalDay,
  subtractLocalDays,
} from "@/lib/plan/tripRange";
import { roomSchedulesQueryKey } from "@/lib/queryKeys/roomSchedules";
import type { PlanDayData, PlanPlace } from "@/mocks/plan";

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
const INITIAL_DAY_COUNT = countInclusiveLocalDays(
  INITIAL_RANGE.start,
  INITIAL_RANGE.end,
);

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

  const [range, setRange] = useState(INITIAL_RANGE);
  const [placesPerDay, setPlacesPerDay] = useState<PlanPlace[][]>(() =>
    Array.from({ length: INITIAL_DAY_COUNT }, () => []),
  );

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

  const toolbarRangeStart = scheduleDerivedRange?.start ?? range.start;
  const toolbarRangeEnd = scheduleDerivedRange?.end ?? range.end;

  const paddedPlacesPerDay = useMemo(() => {
    const n = serverDriven
      ? scheduleList.length
      : countInclusiveLocalDays(range.start, range.end);
    return Array.from({ length: n }, (_, i) => placesPerDay[i] ?? []);
  }, [
    serverDriven,
    scheduleList.length,
    range.start,
    range.end,
    placesPerDay,
  ]);

  const planDays: PlanDayData[] = useMemo(() => {
    if (scheduleList.length > 0) {
      return mergeSchedulesWithPlaces(scheduleList);
    }
    return mergePlanDaysWithPlaces(
      range.start,
      range.end,
      paddedPlacesPerDay,
    );
  }, [scheduleList, paddedPlacesPerDay, range.start, range.end]);

  const updateDayPlaces = useCallback((dayIndex: number, next: PlanPlace[]) => {
    setPlacesPerDay((rows) => {
      const out = rows.slice();
      out[dayIndex] = next;
      return out;
    });
  }, []);

  const handleDeleteDayLocal = useCallback((dayIndex: number) => {
    setRange((r) => ({
      start: r.start,
      end: subtractLocalDays(r.end, 1),
    }));
    setPlacesPerDay((rows) => rows.filter((_, i) => i !== dayIndex));
  }, []);

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
      if (scheduleList.length > 0) {
        try {
          await syncSchedulesToRange({
            start: s,
            end: e,
            currentSchedules: scheduleList,
          });
        } catch {
          toast.error("여행 기간을 서버에 반영하지 못했어요.");
          throw new Error("sync schedules failed");
        }
        return;
      }
      setRange({ start: s, end: e });
      setPlacesPerDay((prev) => {
        const n = countInclusiveLocalDays(s, e);
        return Array.from({ length: n }, (_, i) => prev[i] ?? []);
      });
    },
    [roomId, scheduleList, syncSchedulesToRange],
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

      {planDays.map((day, dayIndex) => (
        <PlanDaySection
          key={day.id}
          title={day.dayLabel}
          subtitle={day.dateLabel}
          onRequestDeleteDay={
            planDays.length > 1
              ? serverDriven
                ? () => handleDeleteScheduleDay(dayIndex)
                : () => handleDeleteDayLocal(dayIndex)
              : undefined
          }
        >
          {serverDriven && sortedSchedules[dayIndex] ? (
            <PlanItinerary
              roomId={roomId}
              scheduleId={sortedSchedules[dayIndex].scheduleId}
              scheduleDateYmd={sortedSchedules[dayIndex].date}
            />
          ) : (
            <PlanItinerary
              places={day.places}
              onPlacesChange={(next: PlanPlace[]) =>
                updateDayPlaces(dayIndex, next)
              }
            />
          )}
        </PlanDaySection>
      ))}
    </div>
  );
}
