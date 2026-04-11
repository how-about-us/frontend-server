"use client";

import { useMemo, useState } from "react";

import { buildPlanDaysFromRange, startOfLocalDay } from "@/lib/plan/tripRange";
import type { PlanDayData } from "@/mocks/plan";

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

export function PlanPageView() {
  const [range, setRange] = useState(defaultTripRange);

  const planDays: PlanDayData[] = useMemo(
    () => buildPlanDaysFromRange(range.start, range.end),
    [range.start.getTime(), range.end.getTime()],
  );

  return (
    <div className="space-y-3">
      <PlanTripRangeToolbar
        rangeStart={range.start}
        rangeEnd={range.end}
        onRangeApply={(start, end) => {
          setRange({ start, end });
        }}
      />

      <PlanChatSectionWidth />

      {planDays.map((day) => (
        <PlanDaySection
          key={day.id}
          title={day.dayLabel}
          subtitle={day.dateLabel}
        >
          <PlanItinerary initialPlaces={day.places} />
        </PlanDaySection>
      ))}
    </div>
  );
}
