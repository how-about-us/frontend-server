"use client";

import { Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useUpdateScheduleItem } from "@/hooks/useRooms";
import { PLAN_PLACE_CARD_TW } from "@/lib/layout-tokens";
import {
  clampStayDurationMinutes,
  formatStayDurationMinutes,
  normalizeStartTimeToHm,
  SCHEDULE_STAY_DURATION_MAX_MINUTES,
} from "@/lib/plan/scheduleTime";
import { cn } from "@/lib/utils";

type PlanItemTimeEditorProps = {
  roomId: string;
  scheduleId: number;
  itemId: number;
  startTime: string;
  durationMinutes: number;
  scheduleOverlapWarning?: string;
  onClose: () => void;
};

const fieldLabelClass = PLAN_PLACE_CARD_TW.timeFieldLabel;
const timeStartInputClass =
  "cursor-pointer text-center [color-scheme:light] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit-fields-wrapper]:flex [&::-webkit-datetime-edit-fields-wrapper]:justify-center";
const startTimeInputClassName = cn(
  PLAN_PLACE_CARD_TW.timeInputCompact,
  timeStartInputClass,
  "tabular-nums",
);

function stopCardActivation(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function PlanStartTimeInput({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
}) {
  const openPicker = (e: React.MouseEvent<HTMLInputElement>) => {
    stopCardActivation(e);
    if (disabled) return;
    const input = e.currentTarget;
    try {
      input.showPicker?.();
    } catch {
      input.focus();
    }
  };

  if (!value) {
    return (
      <div
        className={cn(
          "relative flex min-w-0 w-full items-center justify-center",
          startTimeInputClassName,
          disabled && "pointer-events-none opacity-70",
        )}
      >
        <span
          className="pointer-events-none text-sm tabular-nums text-dark-gray/70"
          aria-hidden
        >
          --:--
        </span>
        <input
          type="time"
          aria-label="시작 시각"
          value=""
          disabled={disabled}
          onMouseDown={stopCardActivation}
          onClick={openPicker}
          onChange={(e) => {
            const v = e.target.value;
            if (v) onChange(v);
          }}
          className="absolute inset-0 z-[1] h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
      </div>
    );
  }

  return (
    <input
      type="time"
      aria-label="시작 시각"
      value={value}
      disabled={disabled}
      onMouseDown={stopCardActivation}
      onClick={openPicker}
      onChange={(e) => onChange(e.target.value)}
      className={startTimeInputClassName}
    />
  );
}

export function PlanItemTimeEditor({
  roomId,
  scheduleId,
  itemId,
  startTime,
  durationMinutes,
  scheduleOverlapWarning,
  onClose,
}: PlanItemTimeEditorProps) {
  const [timeHm, setTimeHm] = useState(() => normalizeStartTimeToHm(startTime));
  const [durationStr, setDurationStr] = useState(() =>
    formatStayDurationMinutes(durationMinutes),
  );
  const { mutateAsync, isPending } = useUpdateScheduleItem();

  const serverHm = normalizeStartTimeToHm(startTime);
  useEffect(() => {
    setTimeHm(serverHm);
  }, [serverHm]);

  useEffect(() => {
    setDurationStr(formatStayDurationMinutes(durationMinutes));
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
      className={PLAN_PLACE_CARD_TW.editorModule}
      onMouseDown={stopCardActivation}
      onClick={stopCardActivation}
    >
      <div className={PLAN_PLACE_CARD_TW.editorSideLabelWrapper}>
        <Clock className="h-6 w-6" aria-hidden />
        <span className={PLAN_PLACE_CARD_TW.editorSideLabelText}>시간</span>
      </div>

      <div className={PLAN_PLACE_CARD_TW.editorBody}>
        {scheduleOverlapWarning ? (
          <p
            role="status"
            className={cn(
              "font-medium text-brand-red break-keep",
              PLAN_PLACE_CARD_TW.overlapWarningCompact,
            )}
          >
            {scheduleOverlapWarning}
          </p>
        ) : null}

        <div className={PLAN_PLACE_CARD_TW.timeFieldsRow}>
          <label className={PLAN_PLACE_CARD_TW.timeField}>
            <span className={fieldLabelClass}>시작</span>
            <PlanStartTimeInput
              value={timeHm}
              disabled={isPending}
              onChange={setTimeHm}
            />
          </label>
          <label className={PLAN_PLACE_CARD_TW.timeField}>
            <span className={fieldLabelClass}>체류(분)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={SCHEDULE_STAY_DURATION_MAX_MINUTES}
              step={1}
              aria-label="체류(분)"
              value={durationStr}
              onMouseDown={stopCardActivation}
              onClick={stopCardActivation}
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
                setDurationStr(String(clampStayDurationMinutes(v)));
              }}
              className={cn(
                PLAN_PLACE_CARD_TW.timeInputCompact,
                "tabular-nums",
              )}
              disabled={isPending}
            />
          </label>
        </div>

        <div className={PLAN_PLACE_CARD_TW.editorFooterRow}>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={cn(
              "cursor-pointer border border-gray-border bg-white text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40",
              PLAN_PLACE_CARD_TW.timeSaveButtonCompact,
            )}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isPending || !dirty}
            className={cn(
              "cursor-pointer bg-brand-green text-white transition hover:bg-brand-green/90 disabled:cursor-not-allowed disabled:opacity-40",
              PLAN_PLACE_CARD_TW.timeSaveButtonCompact,
            )}
          >
            {isPending ? "저장 중…" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
