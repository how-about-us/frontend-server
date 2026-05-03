"use client";

import { useCallback } from "react";
import { ArrowDown } from "lucide-react";
import { toast } from "sonner";

import { useUpdateScheduleItemTravelMode } from "@/hooks/useRooms";
import type { PlanPlace } from "@/lib/plan/types";
import {
  SCHEDULE_TRAVEL_MODES,
  scheduleTravelModeLabel,
} from "@/lib/plan/scheduleTravelMode";
import { cn } from "@/lib/utils";

export type PlanTravelTimeProps = {
  roomId: string;
  scheduleId: number;
  /** 도착 일정 항목 ID — 서버에서 이 항목의 `travelMode`가 직전 장소→이 장소 구간을 의미 */
  destinationItemId?: number;
  /** 서버에서 내려준 구간 이동 수단 코드 */
  travelMode: string;
  fromPlace: PlanPlace;
  toPlace: PlanPlace;
  /** 소요 시간(분). 없으면 시간 숫자는 표시하지 않습니다. */
  minutes?: number;
  className?: string;
};

const selectClass =
  "rounded-lg border border-gray-border bg-white px-2 py-1 text-xs text-gray-900 shadow-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green disabled:cursor-not-allowed disabled:opacity-50";

export function PlanTravelTime({
  roomId,
  scheduleId,
  destinationItemId,
  travelMode,
  fromPlace,
  toPlace,
  minutes,
  className,
}: PlanTravelTimeProps) {
  const { mutateAsync: patchTravelMode, isPending } =
    useUpdateScheduleItemTravelMode();

  const modeRaw = typeof travelMode === "string" ? travelMode.trim() : "";
  const effectiveMode =
    modeRaw.length > 0 ? modeRaw : SCHEDULE_TRAVEL_MODES[0].value;

  const knownValues = new Set<string>(
    SCHEDULE_TRAVEL_MODES.map((m) => m.value),
  );
  const showUnknownOption =
    modeRaw.length > 0 && !knownValues.has(modeRaw);

  const handleTravelModeChange = useCallback(
    async (value: string) => {
      if (
        typeof destinationItemId !== "number" ||
        value === effectiveMode ||
        isPending
      ) {
        return;
      }
      try {
        await patchTravelMode({
          roomId,
          scheduleId,
          itemId: destinationItemId,
          body: { travelMode: value },
        });
      } catch {
        toast.error("이동 수단을 바꾸지 못했어요.");
      }
    },
    [
      destinationItemId,
      effectiveMode,
      isPending,
      patchTravelMode,
      roomId,
      scheduleId,
    ],
  );

  const label =
    minutes != null
      ? `${fromPlace.title}에서 ${toPlace.title}까지 약 ${minutes}분`
      : `${fromPlace.title}에서 ${toPlace.title}까지 이동`;

  const canPatch = typeof destinationItemId === "number";

  return (
    <div
      className={cn("flex items-stretch gap-3 py-2 pl-1", className)}
      role="separator"
      aria-label={label}
    >
      <div className="flex w-8 shrink-0 flex-col items-center">
        <div className="min-h-3 flex-1 w-px bg-gradient-to-b from-gray-border to-light-gray" />
        <ArrowDown
          className="my-1 h-4 w-4 shrink-0 text-brand-green"
          aria-hidden
        />
        <div className="min-h-3 flex-1 w-px bg-gradient-to-b from-light-gray to-gray-border" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
        <p className="text-xs leading-snug text-dark-gray">
          <span className="font-medium text-gray-900">{fromPlace.title}</span>
          <span className="mx-1 text-light-gray">→</span>
          <span className="font-medium text-gray-900">{toPlace.title}</span>
        </p>
        {minutes != null ? (
          <p className="text-xs text-dark-gray/90">약 {minutes}분</p>
        ) : (
          <p className="text-xs text-dark-gray/90">다음 장소로 이동</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-dark-gray">이동 수단</span>
          {canPatch ? (
            <select
              className={cn(selectClass, "min-w-[7.5rem]")}
              value={effectiveMode}
              disabled={isPending}
              aria-label="이동 수단 변경"
              onChange={(e) => void handleTravelModeChange(e.target.value)}
            >
              {showUnknownOption ? (
                <option value={modeRaw}>
                  {scheduleTravelModeLabel(modeRaw)}
                </option>
              ) : null}
              {SCHEDULE_TRAVEL_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-medium text-gray-900">
              {scheduleTravelModeLabel(effectiveMode)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
