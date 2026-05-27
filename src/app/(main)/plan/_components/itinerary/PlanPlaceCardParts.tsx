import type { MouseEvent, ReactNode } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { PLAN_PLACE_CARD_TW } from "@/lib/layout-tokens";
import { cn } from "@/lib/utils";

const stopFormClickPropagation = {
  onMouseDown: (e: MouseEvent) => e.stopPropagation(),
  onClick: (e: MouseEvent) => e.stopPropagation(),
} as const;

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
}: {
  disabled: boolean;
  onDelete: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "shrink-0 cursor-pointer rounded-lg text-dark-gray transition hover:bg-brand-red/10 hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-40",
        PLAN_PLACE_CARD_TW.deleteButtonCompact,
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

export function PlanPlaceCardControlsStack({ children }: { children: ReactNode }) {
  return (
    <div className={PLAN_PLACE_CARD_TW.controlsStack} {...stopFormClickPropagation}>
      {children}
    </div>
  );
}

export function PlanCollapsibleField({
  label,
  collapsedHint,
  expanded,
  onToggle,
  disabled,
  panelId,
  children,
}: {
  label: string;
  collapsedHint?: string;
  expanded: boolean;
  onToggle: () => void;
  disabled?: boolean;
  panelId: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 w-full flex-col gap-0.5">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        disabled={disabled}
        onMouseDown={stopFormClickPropagation.onMouseDown}
        onClick={(e) => {
          stopFormClickPropagation.onClick(e);
          onToggle();
        }}
        className={cn(
          PLAN_PLACE_CARD_TW.sectionToggle,
          disabled && "pointer-events-none opacity-70",
        )}
      >
        {expanded ?
          <ChevronUp className="h-3 w-3 shrink-0" aria-hidden />
        : <ChevronDown className="h-3 w-3 shrink-0" aria-hidden />}
        <span className="shrink-0">{label}</span>
        {!expanded && collapsedHint ?
          <span className={PLAN_PLACE_CARD_TW.sectionToggleHint}>
            {collapsedHint}
          </span>
        : null}
      </button>
      {expanded ?
        <div id={panelId} className="flex min-w-0 w-full flex-col gap-1">
          {children}
        </div>
      : null}
    </div>
  );
}
