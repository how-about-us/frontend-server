"use client";

import { MapPinIconWithoutCircle } from "@/components/icons";
import { cn } from "@/lib/utils";

const PIN_SIZE_PX = 36;

export type PlanItineraryStopMapPinProps = {
  /** 표시 순번 (1부터). 호출부에서 `orderIdx + 1` 전달 권장 */
  orderLabel: number;
  className?: string;
};

/**
 * 내부 원 링 없는 핀(`MapPinIconWithoutCircle`) 위에 순번을 얹어 일정 경로 정류장을 표현합니다.
 */
export function PlanItineraryStopMapPin({
  orderLabel,
  className,
}: PlanItineraryStopMapPinProps) {
  const twoDigits = orderLabel >= 10;

  return (
    <span
      className={cn(
        "relative inline-block text-brand-red drop-shadow-md",
        className,
      )}
    >
      <MapPinIconWithoutCircle size={PIN_SIZE_PX} />
      <span
        className={cn(
          "pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 font-semibold tabular-nums leading-none tracking-tight text-white",
          twoDigits ? "text-[12px]" : "text-[15px]",
        )}
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.42)" }}
        aria-hidden
      >
        {orderLabel}
      </span>
    </span>
  );
}
