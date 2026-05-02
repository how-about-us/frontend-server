"use client";

import { useMemo } from "react";

import { buildMonthCells, isSameLocalDay } from "@/lib/plan/tripRange";
import { cn } from "@/lib/utils";

import { inInclusiveRange } from "./planTripRangeCalendar";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export type PlanTripRangeMonthGridProps = {
  year: number;
  monthIndex0: number;
  title: string;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  today: Date;
  onDayClick: (d: Date) => void;
};

export function PlanTripRangeMonthGrid({
  year,
  monthIndex0,
  title,
  rangeStart,
  rangeEnd,
  today,
  onDayClick,
}: PlanTripRangeMonthGridProps) {
  const cells = useMemo(
    () => buildMonthCells(year, monthIndex0),
    [year, monthIndex0],
  );

  const spanSingleDay =
    rangeStart && rangeEnd && isSameLocalDay(rangeStart, rangeEnd);

  return (
    <div>
      <p className="mb-3 text-center text-sm font-semibold text-gray-900">
        {title}
      </p>
      <div className="grid grid-cols-7 gap-px border border-gray-border bg-gray-border">
        {WEEK_LABELS.map((w) => (
          <div
            key={w}
            className="bg-white py-2 text-center text-xs font-medium text-dark-gray"
          >
            {w}
          </div>
        ))}
        {cells.map((cell, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square min-h-[36px] bg-white",
              cell && inInclusiveRange(cell, rangeStart, rangeEnd) && "bg-light-gray",
            )}
          >
            {cell ? (
              <button
                type="button"
                onClick={() => onDayClick(cell)}
                className={cn(
                  "flex h-full w-full items-center justify-center text-sm text-gray-900 transition",
                  isSameLocalDay(cell, today) &&
                    "font-semibold ring-1 ring-inset ring-brand-green/50",
                  spanSingleDay &&
                    rangeStart &&
                    isSameLocalDay(cell, rangeStart) &&
                    "rounded-md bg-light-gray font-semibold",
                  !spanSingleDay &&
                    rangeStart &&
                    rangeEnd &&
                    isSameLocalDay(cell, rangeStart) &&
                    "rounded-l-md bg-light-gray font-semibold",
                  !spanSingleDay &&
                    rangeStart &&
                    rangeEnd &&
                    isSameLocalDay(cell, rangeEnd) &&
                    "rounded-r-md bg-light-gray font-semibold",
                  rangeStart &&
                    !rangeEnd &&
                    isSameLocalDay(cell, rangeStart) &&
                    "rounded-md bg-light-gray font-semibold",
                )}
              >
                {cell.getDate()}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
