"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUpdateScheduleItem } from "@/hooks/useRooms";
import { normalizeStartTimeToHm } from "@/lib/plan/scheduleTime";

type PlanItemTimeFormProps = {
  roomId: string;
  scheduleId: number;
  itemId: number;
  startTime: string;
  durationMinutes: number;
};

const inputClass =
  "rounded-lg border border-gray-border bg-white px-2.5 py-1.5 text-sm text-gray-900 shadow-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green";

export function PlanItemTimeForm({
  roomId,
  scheduleId,
  itemId,
  startTime,
  durationMinutes,
}: PlanItemTimeFormProps) {
  const [timeHm, setTimeHm] = useState(() => normalizeStartTimeToHm(startTime));
  const [durationStr, setDurationStr] = useState(String(durationMinutes));
  const { mutateAsync, isPending } = useUpdateScheduleItem();

  useEffect(() => {
    setTimeHm(normalizeStartTimeToHm(startTime));
    setDurationStr(String(durationMinutes));
  }, [startTime, durationMinutes, itemId]);

  async function handleSave() {
    const dm = parseInt(durationStr, 10);
    if (!Number.isFinite(dm) || dm < 0) {
      toast.error("체류 시간은 0 이상의 정수로 입력해 주세요.");
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
  const baselineDur = String(durationMinutes);
  const dirty = baselineTime !== timeHm || baselineDur !== durationStr;

  return (
    <div className="flex w-full flex-col gap-2 border-t border-gray-border/70 pt-3 mt-1">
      <p className="text-xs font-medium text-dark-gray">체류 시간</p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-dark-gray">시작</span>
          <input
            type="time"
            value={timeHm}
            onChange={(e) => setTimeHm(e.target.value)}
            className={inputClass}
            disabled={isPending}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-dark-gray">체류(분)</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={durationStr}
            onChange={(e) => setDurationStr(e.target.value)}
            className={`w-24 ${inputClass}`}
            disabled={isPending}
          />
        </label>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={isPending || !dirty}
          className="rounded-lg bg-brand-green px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}
