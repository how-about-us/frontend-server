"use client";

import { Clock, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUpdateScheduleItem } from "@/hooks/useRooms";
import { PLAN_PLACE_CARD_TW } from "@/lib/layout-tokens";
import {
  clampStayDurationMinutes,
  canEditScheduleStayDuration,
  formatStayDurationMinutes,
  hasScheduleTimeDraftValue,
  normalizeStartTimeToHm,
  SCHEDULE_STAY_DURATION_MAX_MINUTES,
  validateScheduleTimeDraft,
} from "@/lib/plan/scheduleTime";
import { cn } from "@/lib/utils";

import { TimeWheelPicker, type TimeWheelValue } from "./TimeWheelPicker";

type PlanItemTimeEditorProps = {
  roomId: string;
  scheduleId: number;
  itemId: number;
  startTime: string;
  durationMinutes: number | null | undefined;
  onClose: () => void;
};

const fieldLabelClass = PLAN_PLACE_CARD_TW.timeFieldLabel;

const DEFAULT_WHEEL_HOUR = 9;
const DEFAULT_WHEEL_MINUTE = 0;

function parseHmToWheel(hm: string): TimeWheelValue {
  const m = /^(\d{2}):(\d{2})$/.exec(hm.trim());
  if (!m) return { hour: DEFAULT_WHEEL_HOUR, minute: DEFAULT_WHEEL_MINUTE };
  const hour = Math.min(23, Math.max(0, parseInt(m[1]!, 10)));
  const minute = Math.min(59, Math.max(0, parseInt(m[2]!, 10)));
  return { hour, minute };
}

function formatWheelToHm({ hour, minute }: TimeWheelValue): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function PlanItemTimeEditor({
  roomId,
  scheduleId,
  itemId,
  startTime,
  durationMinutes,
  onClose,
}: PlanItemTimeEditorProps) {
  const [timeHm, setTimeHm] = useState(() => normalizeStartTimeToHm(startTime));
  const [durationStr, setDurationStr] = useState(() =>
    formatStayDurationMinutes(durationMinutes),
  );
  const [resetPending, setResetPending] = useState(false);
  const { mutateAsync, isPending } = useUpdateScheduleItem();

  const serverHm = normalizeStartTimeToHm(startTime);
  useEffect(() => {
    setTimeHm(serverHm);
  }, [serverHm]);

  useEffect(() => {
    setDurationStr(formatStayDurationMinutes(durationMinutes));
  }, [durationMinutes]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isPending, onClose]);

  const hasDraftValue = hasScheduleTimeDraftValue(timeHm, durationStr);
  const stayDurationEnabled = canEditScheduleStayDuration(timeHm);

  function handleReset() {
    setResetPending(true);
    setTimeHm("");
    setDurationStr("0");
  }

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
    const trimmedHm = timeHm.trim();
    if (trimmedHm.length > 0 && !/^\d{2}:\d{2}$/.test(trimmedHm)) {
      toast.error("시작 시각을 올바르게 선택해 주세요.");
      return;
    }
    const draftValidation = validateScheduleTimeDraft(trimmedHm, dm);
    if (!draftValidation.valid) {
      toast.error(draftValidation.message);
      return;
    }
    try {
      const shouldClearDuration = resetPending || !stayDurationEnabled;
      await mutateAsync({
        roomId,
        scheduleId,
        itemId,
        body: {
          startTime: trimmedHm.length > 0 ? trimmedHm : null,
          durationMinutes: shouldClearDuration ? null : dm,
        },
      });
      toast.success("체류 시간을 저장했어요.");
      onClose();
    } catch {
      toast.error("체류 시간을 저장하지 못했어요.");
    }
  }

  const baselineTime = normalizeStartTimeToHm(startTime);
  const baselineDur = formatStayDurationMinutes(durationMinutes);
  const dirty = baselineTime !== timeHm || baselineDur !== durationStr;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-item-time-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl"
      >
        <div className="flex items-center gap-2 px-6 pb-3 pt-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
            <Clock className="h-5 w-5" aria-hidden />
          </span>
          <h2
            id="plan-item-time-dialog-title"
            className="flex-1 text-[19px] font-bold text-gray-900"
          >
            시간 설정
          </h2>
          {hasDraftValue ? (
            <button
              type="button"
              aria-label="시간 초기화"
              onClick={handleReset}
              disabled={isPending}
              className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-dark-gray transition hover:bg-brand-red/10 hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6">
          <div className="flex flex-col items-center gap-2">
            <span className={cn(fieldLabelClass, "self-center")}>시작</span>
            <TimeWheelPicker
              value={parseHmToWheel(timeHm)}
              disabled={isPending}
              onChange={(next) => {
                setResetPending(false);
                const hm = formatWheelToHm(next);
                setTimeHm(hm);
                if (!canEditScheduleStayDuration(hm)) {
                  setDurationStr("0");
                }
              }}
            />
            {timeHm.length === 0 ? (
              <span className="text-xs text-dark-gray/70">
                시간 미설정 · 스크롤 또는 탭으로 시각 지정
              </span>
            ) : null}
          </div>

          <label className={cn(PLAN_PLACE_CARD_TW.timeField, "self-stretch")}>
            <span className={fieldLabelClass}>체류(분)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={SCHEDULE_STAY_DURATION_MAX_MINUTES}
              step={1}
              aria-label="체류(분)"
              value={durationStr}
              onChange={(e) => {
                setResetPending(false);
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
                setDurationStr(String(clampStayDurationMinutes(v)));
              }}
              className={cn(
                PLAN_PLACE_CARD_TW.timeInputCompact,
                "tabular-nums",
              )}
              disabled={isPending || !stayDurationEnabled}
            />
          </label>

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="h-10 shrink-0 cursor-pointer rounded-lg border border-gray-border bg-white px-4 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isPending || !dirty}
              className="h-10 shrink-0 cursor-pointer rounded-lg bg-brand-green px-4 text-sm font-medium text-white transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
