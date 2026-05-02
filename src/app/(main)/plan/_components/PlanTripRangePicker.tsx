"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { startOfLocalDay } from "@/lib/plan/tripRange";

import { monthTitle, shiftMonth } from "./planTripRangeCalendar";
import { PlanTripRangeMonthGrid } from "./PlanTripRangeMonthGrid";

export type PlanTripRangePickerProps = {
  open: boolean;
  onClose: () => void;
  /** 확인 시 — 비동기면 완료 후 다이얼로그가 닫힙니다. 실패 시 닫히지 않습니다. */
  onConfirm: (start: Date, end: Date) => void | Promise<void>;
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
  const [rangeStart, setRangeStart] = useState<Date | null>(
    initialStart ?? null,
  );
  const [rangeEnd, setRangeEnd] = useState<Date | null>(initialEnd ?? null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const v = initialViewDate ?? new Date();
    setViewY(v.getFullYear());
    setViewM(v.getMonth());
    setRangeStart(initialStart ?? null);
    setRangeEnd(initialEnd ?? null);
    setConfirmBusy(false);
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

  const handleConfirm = useCallback(async () => {
    if (!rangeStart || !rangeEnd || confirmBusy) return;
    try {
      setConfirmBusy(true);
      await Promise.resolve(onConfirm(rangeStart, rangeEnd));
      onClose();
    } catch {
      // 부모에서 토스트 처리
    } finally {
      setConfirmBusy(false);
    }
  }, [rangeStart, rangeEnd, onConfirm, onClose, confirmBusy]);

  const today = startOfLocalDay(new Date());

  if (!open || typeof document === "undefined") return null;

  const overlay = (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/25"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-trip-range-title"
        className="relative z-10 w-full max-w-[720px] rounded-2xl border border-gray-border bg-white p-5 shadow-xl"
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
          <PlanTripRangeMonthGrid
            year={viewY}
            monthIndex0={viewM}
            title={monthTitle(viewY, viewM)}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            today={today}
            onDayClick={handleDayClick}
          />
          <PlanTripRangeMonthGrid
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
            disabled={confirmBusy}
            className="rounded-xl px-4 py-2 text-sm font-medium text-dark-gray hover:bg-bubble-gray disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            disabled={!rangeStart || !rangeEnd || confirmBusy}
            className="rounded-xl bg-brand-green px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            onClick={() => void handleConfirm()}
          >
            {confirmBusy ? "적용 중…" : "확인"}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
