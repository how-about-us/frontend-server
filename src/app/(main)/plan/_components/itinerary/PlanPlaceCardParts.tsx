import type { MouseEvent, ReactNode } from "react";
import { Trash2 } from "lucide-react";

import { PLAN_PLACE_CARD_TW } from "@/lib/layout-tokens";
import { cn } from "@/lib/utils";

export function PlanOrderIndexBadge({
  orderIndex,
  backgroundColorHex,
  className,
}: {
  orderIndex: number;
  /** 지도 일차 경로색과 동일한 hex — 유효하지 않으면 brand-red 클래스 */
  backgroundColorHex?: string;
  className?: string;
}) {
  const hex =
    typeof backgroundColorHex === "string" ?
      backgroundColorHex.trim()
    : "";
  const customBg =
    hex.length === 7 && hex.startsWith("#") && /^#[0-9a-fA-F]{6}$/.test(hex);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md font-bold text-white",
        PLAN_PLACE_CARD_TW.orderBadgeCompact,
        !customBg && "bg-brand-red",
        className,
      )}
      style={customBg ? { backgroundColor: hex } : undefined}
      aria-label={`${orderIndex}번째 장소`}
    >
      {orderIndex}
    </span>
  );
}

export function PlanScheduleItemDeleteButton({
  disabled,
  onDelete,
  gridPlacementClassName,
}: {
  disabled: boolean;
  onDelete: () => void;
  gridPlacementClassName?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "shrink-0 cursor-pointer rounded-lg text-dark-gray transition hover:bg-brand-red/10 hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-40",
        PLAN_PLACE_CARD_TW.deleteButtonCompact,
        gridPlacementClassName,
      )}
      aria-label="일정에서 삭제"
      disabled={disabled}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
    >
      <Trash2
        className={PLAN_PLACE_CARD_TW.deleteIconCompact}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
}

const stopFormClickPropagation = {
  onMouseDown: (e: MouseEvent) => e.stopPropagation(),
  onClick: (e: MouseEvent) => e.stopPropagation(),
} as const;

export function PlanPlaceCardTimeCell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={PLAN_PLACE_CARD_TW.timeCell} {...stopFormClickPropagation}>
      {children}
    </div>
  );
}
