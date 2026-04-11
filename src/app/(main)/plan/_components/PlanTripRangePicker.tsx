"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  buildMonthCells,
  isSameLocalDay,
  startOfLocalDay,
} from "@/lib/plan/tripRange";
import { cn } from "@/lib/utils";

const WEEK_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function monthTitle(year: number, monthIndex0: number): string {
  return `${monthIndex0 + 1}월 ${year}`;
}

function shiftMonth(year: number, monthIndex0: number, delta: number) {
  const d = new Date(year, monthIndex0 + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

function inInclusiveRange(
  d: Date,
  start: Date | null,
  end: Date | null,
): boolean {
  if (!start || !end) return false;
  const t = startOfLocalDay(d).getTime();
  const a = startOfLocalDay(start).getTime();
  const b = startOfLocalDay(end).getTime();
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return t >= lo && t <= hi;
}

type PlanTripRangePickerProps = {
  open: boolean;
  onClose: () => void;
  /** 확인 시 (시작일, 종료일) — 로컬 날짜 기준 */
  onConfirm: (start: Date, end: Date) => void;
  /** 패널 열 때 달력이 가리킬 기준 (기본: 오늘) */
  initialViewDate?: Date;
  initialStart?: Date | null;
  initialEnd?: Date | null;
};

export function PlanTripRangePicker({
  open,
  onClose,
  onConfirm,
  initialViewDate,
  initialStart,
  initialEnd,
}: PlanTripRangePickerProps) {
  const base = initialViewDate ?? new Date();
  const [viewY, setViewY] = useState(base.getFullYear());
  const [viewM, setViewM] = useState(base.getMonth());
  const [rangeStart, setRangeStart] = useState<Date | null>(initialStart ?? null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(initialEnd ?? null);

  useEffect(() => {
    if (!open) return;
    const v = initialViewDate ?? new Date();
    setViewY(v.getFullYear());
    setViewM(v.getMonth());
    setRangeStart(initialStart ?? null);
    setRangeEnd(initialEnd ?? null);
  }, [open, initialViewDate, initialStart, initialEnd]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const right = useMemo(() => shiftMonth(viewY, viewM, 1), [viewY, viewM]);

  const handleDayClick = useCallback(
    (d: Date) => {
      const day = startOfLocalDay(d);
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(day);
        setRangeEnd(null);
        return;
      }
      if (rangeStart && !rangeEnd) {
        if (day < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(day);
        } else {
          setRangeEnd(day);
        }
      }
    },
    [rangeStart, rangeEnd],
  );

  const handleConfirm = useCallback(() => {
    if (!rangeStart || !rangeEnd) return;
    onConfirm(rangeStart, rangeEnd);
    onClose();
  }, [rangeStart, rangeEnd, onConfirm, onClose]);

  const today = startOfLocalDay(new Date());

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/25"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-trip-range-title"
        className="relative z-10 w-full max-w-[720px] rounded-2xl border border-gray-border bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-border text-dark-gray hover:bg-bubble-gray"
            onClick={() => {
              const { y, m } = shiftMonth(viewY, viewM, -1);
              setViewY(y);
              setViewM(m);
            }}
            aria-label="이전 달"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 id="plan-trip-range-title" className="sr-only">
            여행 기간 선택
          </h2>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-border text-dark-gray hover:bg-bubble-gray"
            onClick={() => {
              const { y, m } = shiftMonth(viewY, viewM, 1);
              setViewY(y);
              setViewM(m);
            }}
            aria-label="다음 달"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <MonthGrid
            year={viewY}
            monthIndex0={viewM}
            title={monthTitle(viewY, viewM)}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            today={today}
            onDayClick={handleDayClick}
          />
          <MonthGrid
            year={right.y}
            monthIndex0={right.m}
            title={monthTitle(right.y, right.m)}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            today={today}
            onDayClick={handleDayClick}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-gray-border pt-4">
          <button
            type="button"
            className="rounded-xl px-4 py-2 text-sm font-medium text-dark-gray hover:bg-bubble-gray"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            disabled={!rangeStart || !rangeEnd}
            className="rounded-xl bg-brand-green px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            onClick={handleConfirm}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

function MonthGrid({
  year,
  monthIndex0,
  title,
  rangeStart,
  rangeEnd,
  today,
  onDayClick,
}: {
  year: number;
  monthIndex0: number;
  title: string;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  today: Date;
  onDayClick: (d: Date) => void;
}) {
  const cells = useMemo(
    () => buildMonthCells(year, monthIndex0),
    [year, monthIndex0],
  );

  const spanSingleDay =
    rangeStart &&
    rangeEnd &&
    isSameLocalDay(rangeStart, rangeEnd);

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

export type PlanTripRangeToolbarProps = {
  onRangeApply: (start: Date, end: Date) => void;
  /** 현재 적용된 기간 (표시용) */
  rangeStart: Date;
  rangeEnd: Date;
};

export function PlanTripRangeToolbar({
  onRangeApply,
  rangeStart,
  rangeEnd,
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
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-border bg-white px-3 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-bubble-gray"
        aria-haspopup="dialog"
        aria-expanded={open}
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
