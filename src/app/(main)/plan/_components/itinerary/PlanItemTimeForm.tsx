"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useUpdateScheduleItem } from "@/hooks/useRooms";
import {
  normalizeStartTimeToHm,
  SCHEDULE_STAY_DURATION_MAX_MINUTES,
} from "@/lib/plan/scheduleTime";
import { cn } from "@/lib/utils";

import { usePlanContainerNarrow } from "../plan-container";

type PlanItemTimeFormProps = {
  roomId: string;
  scheduleId: number;
  itemId: number;
  startTime: string;
  durationMinutes: number;
  scheduleOverlapWarning?: string;
};

const inputClass =
  "rounded-lg border border-gray-border bg-white px-2.5 py-1.5 text-sm text-gray-900 shadow-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green";

export function PlanItemTimeForm({
  roomId,
  scheduleId,
  itemId,
  startTime,
  durationMinutes,
  scheduleOverlapWarning,
}: PlanItemTimeFormProps) {
  const [timeExpanded, setTimeExpanded] = useState(false);
  const collapseWhenWide = useCallback(() => setTimeExpanded(false), []);
  const layoutNarrow = usePlanContainerNarrow(collapseWhenWide);

  const [timeHm, setTimeHm] = useState(() => normalizeStartTimeToHm(startTime));
  const [durationStr, setDurationStr] = useState(String(durationMinutes));
  const { mutateAsync, isPending } = useUpdateScheduleItem();

  const serverHm = normalizeStartTimeToHm(startTime);
  useEffect(() => {
    setTimeHm(serverHm);
  }, [serverHm]);

  useEffect(() => {
    const d = durationMinutes;
    const capped = Math.min(
      Math.max(0, typeof d === "number" && Number.isFinite(d) ? d : 0),
      SCHEDULE_STAY_DURATION_MAX_MINUTES,
    );
    setDurationStr(String(capped));
  }, [durationMinutes]);

  async function handleSave() {
    const dm = parseInt(durationStr, 10);
    if (!Number.isFinite(dm) || dm < 0) {
      toast.error("체류 시간은 0 이상의 정수로 입력해 주세요.");
      return;
    }
    if (dm > SCHEDULE_STAY_DURATION_MAX_MINUTES) {
      toast.error(
        `체류 시간은 ${SCHEDULE_STAY_DURATION_MAX_MINUTES}분 이하여야 해요.`,
      );
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(timeHm)) {
      toast.error("시작 시각을 올바르게 선택해 주세요.");
      return;
    }
    try {
      await mutateAsync({
        roomId,
        scheduleId,
        itemId,
        body: { startTime: timeHm, durationMinutes: dm },
      });
      toast.success("체류 시간을 저장했어요.");
    } catch {
      toast.error("체류 시간을 저장하지 못했어요.");
    }
  }

  const baselineTime = normalizeStartTimeToHm(startTime);
  const baselineDur = String(
    Math.min(
      Math.max(
        0,
        typeof durationMinutes === "number" && Number.isFinite(durationMinutes)
          ? durationMinutes
          : 0,
      ),
      SCHEDULE_STAY_DURATION_MAX_MINUTES,
    ),
  );
  const dirty = baselineTime !== timeHm || baselineDur !== durationStr;

  const overlapBanner =
    scheduleOverlapWarning ? (
      <p
        role="status"
        className="text-xs font-medium text-brand-red break-keep"
      >
        {scheduleOverlapWarning}
      </p>
    ) : null;

  const fields = (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-dark-gray">시작</span>
        {!timeHm ? (
          <div
            className={cn(
              "relative flex min-h-[2.375rem] items-center",
              inputClass,
              !isPending && "cursor-pointer",
              isPending && "pointer-events-none opacity-70",
            )}
          >
            <span
              className="pointer-events-none text-sm tabular-nums tracking-wide text-dark-gray"
              aria-hidden
            >
              -- : --
            </span>
            <input
              type="time"
              aria-label="시작 시각"
              value=""
              disabled={isPending}
              onChange={(e) => {
                const v = e.target.value;
                if (v) setTimeHm(v);
              }}
              className="absolute inset-0 z-[1] h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
          </div>
        ) : (
          <input
            type="time"
            aria-label="시작 시각"
            value={timeHm}
            onChange={(e) => setTimeHm(e.target.value)}
            className={cn(inputClass, "[color-scheme:light]")}
            disabled={isPending}
          />
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-[11px] text-dark-gray">체류(분)</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={SCHEDULE_STAY_DURATION_MAX_MINUTES}
          step={1}
          value={durationStr}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "") {
              setDurationStr("");
              return;
            }
            const v = parseInt(raw, 10);
            if (!Number.isFinite(v)) {
              setDurationStr(raw);
              return;
            }
            const clamped = Math.min(
              Math.max(0, v),
              SCHEDULE_STAY_DURATION_MAX_MINUTES,
            );
            setDurationStr(String(clamped));
          }}
          className={`w-24 ${inputClass}`}
          disabled={isPending}
        />
      </label>
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={isPending || !dirty}
        className="cursor-pointer rounded-lg bg-brand-green px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isPending ? "저장 중…" : "저장"}
      </button>
    </div>
  );

  const narrowMode = layoutNarrow === true;

  return (
    <div className="mt-1 flex w-full flex-col gap-2 border-t border-gray-border/70 pt-3">
      {overlapBanner}
      {narrowMode ? (
        <>
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg py-1 text-left text-dark-gray transition hover:bg-gray-border/25"
            aria-expanded={timeExpanded}
            onClick={() => setTimeExpanded((o) => !o)}
          >
            <span className="text-xs font-medium text-dark-gray">
              체류 시간
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                timeExpanded && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {timeExpanded ? (
            <div className="flex flex-col gap-2 border-t border-dashed border-gray-border pt-3">
              {fields}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p className="text-xs font-medium text-dark-gray">체류 시간</p>
          {fields}
        </>
      )}
    </div>
  );
}
