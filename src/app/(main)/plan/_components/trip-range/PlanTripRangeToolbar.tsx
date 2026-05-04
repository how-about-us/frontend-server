"use client";

import { useMemo, useState } from "react";

import { startOfLocalDay } from "@/lib/plan/tripRange";

import { PlanTripRangePicker } from "./PlanTripRangePicker";

export type PlanTripRangeToolbarProps = {
  onRangeApply: (start: Date, end: Date) => void | Promise<void>;
  /** 현재 적용된 기간 (표시용) */
  rangeStart: Date;
  rangeEnd: Date;
  /** 달력·여행 기간 버튼 비활성화 (예: 로딩 중) */
  readOnly?: boolean;
};

export function PlanTripRangeToolbar({
  onRangeApply,
  rangeStart,
  rangeEnd,
  readOnly = false,
}: PlanTripRangeToolbarProps) {
  const [open, setOpen] = useState(false);

  const label = useMemo(() => {
    const a = startOfLocalDay(rangeStart);
    const b = startOfLocalDay(rangeEnd);
    return `${a.getMonth() + 1}/${a.getDate()} – ${b.getMonth() + 1}/${b.getDate()}`;
  }, [rangeStart, rangeEnd]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        disabled={readOnly}
        onClick={() => {
          if (readOnly) return;
          setOpen(true);
        }}
        className={`inline-flex h-10 items-center gap-2 rounded-xl border border-gray-border bg-white px-3 text-sm font-medium text-gray-900 shadow-sm transition ${
          readOnly
            ? "cursor-default opacity-70"
            : "hover:bg-bubble-gray"
        }`}
        aria-haspopup={readOnly ? undefined : "dialog"}
        aria-expanded={readOnly ? undefined : open}
      >
        <img
          src="/icons/calendar-days.svg"
          alt=""
          className="h-[22px] w-[22px] shrink-0"
        />
        <span>여행 기간</span>
        <span className="text-dark-gray">· {label}</span>
      </button>

      <PlanTripRangePicker
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={onRangeApply}
        initialViewDate={rangeStart}
        initialStart={rangeStart}
        initialEnd={rangeEnd}
      />
    </div>
  );
}
