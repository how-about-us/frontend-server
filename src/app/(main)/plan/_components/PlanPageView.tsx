"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useSessionStore } from "@/stores/session-store";

import {
  countInclusiveLocalDays,
  mergePlanDaysWithPlaces,
  startOfLocalDay,
  subtractLocalDays,
} from "@/lib/plan/tripRange";
import type { PlanDayData, PlanPlace } from "@/mocks/plan";

import { PlanChatSectionWidth } from "./PlanChatSectionWidth";
import { PlanDaySection } from "./PlanDaySection";
import { PlanItinerary } from "./PlanItinerary";
import { PlanTripRangeToolbar } from "./PlanTripRangePicker";

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
  const [range, setRange] = useState(INITIAL_RANGE);
  const [placesPerDay, setPlacesPerDay] = useState<PlanPlace[][]>(() =>
    Array.from({ length: INITIAL_DAY_COUNT }, () => []),
  );

  const planDays: PlanDayData[] = useMemo(
    () => mergePlanDaysWithPlaces(range.start, range.end, placesPerDay),
    [range.start.getTime(), range.end.getTime(), placesPerDay],
  );

  const updateDayPlaces = useCallback((dayIndex: number, next: PlanPlace[]) => {
    setPlacesPerDay((rows) => {
      const out = rows.slice();
      out[dayIndex] = next;
      return out;
    });
  }, []);

  const handleDeleteDay = useCallback((dayIndex: number) => {
    setRange((r) => ({
      start: r.start,
      end: subtractLocalDays(r.end, 1),
    }));
    setPlacesPerDay((rows) => rows.filter((_, i) => i !== dayIndex));
  }, []);

  return (
    <div className="space-y-3 pl-6 pr-6">
      <PlanTripRangeToolbar
        rangeStart={range.start}
        rangeEnd={range.end}
        onRangeApply={(start, end) => {
          const s = startOfLocalDay(start);
          const e = startOfLocalDay(end);
          setRange({ start: s, end: e });
          setPlacesPerDay((prev) => {
            const n = countInclusiveLocalDays(s, e);
            return Array.from({ length: n }, (_, i) => prev[i] ?? []);
          });
        }}
      />

      <PlanChatSectionWidth />

      {planDays.map((day, dayIndex) => (
        <PlanDaySection
          key={day.id}
          title={day.dayLabel}
          subtitle={day.dateLabel}
          onRequestDeleteDay={
            planDays.length > 1 ? () => handleDeleteDay(dayIndex) : undefined
          }
        >
          <PlanItinerary
            places={day.places}
            onPlacesChange={(next) => updateDayPlaces(dayIndex, next)}
          />
        </PlanDaySection>
      ))}
    </div>
  );
}
