"use client";

import type { DragEvent } from "react";
import Image from "next/image";

import type { PlanPlace } from "@/mocks/plan";
import { slotStartTimeHm } from "@/lib/plan/scheduleItemPlaces";
import { cn } from "@/lib/utils";

import { PlanItemTimeForm } from "./PlanItemTimeForm";

export type PlanPlaceCardProps = {
  place: PlanPlace;
  /** 카드에 표시하는 순번 (1부터) */
  orderIndex: number;
  isDragging: boolean;
  isDropTarget: boolean;
  /** 서버 동기화 일정에서는 순서 변경 비활성화 */
  dragDisabled?: boolean;
  /** `itemId`가 있을 때 카드 안에서 일정 시간 편집 */
  scheduleTimeEdit?: {
    roomId: string;
    scheduleId: number;
    /** `slotStartTimeHm` 폴백용 0-based 인덱스 */
    slotIndex: number;
  };
  onDragStart: (e: DragEvent) => void;
  onDragEnd: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
};

export function PlanPlaceCard({
  place,
  orderIndex,
  isDragging,
  isDropTarget,
  dragDisabled = false,
  scheduleTimeEdit,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: PlanPlaceCardProps) {
  const imageSrc =
    place.imageUrl ?? `https://picsum.photos/seed/plan-${place.id}/320/240`;

  return (
    <article
      draggable={!dragDisabled}
      onDragStart={dragDisabled ? undefined : onDragStart}
      onDragEnd={dragDisabled ? undefined : onDragEnd}
      onDragOver={dragDisabled ? undefined : onDragOver}
      onDragLeave={dragDisabled ? undefined : onDragLeave}
      onDrop={dragDisabled ? undefined : onDrop}
      className={cn(
        "relative flex min-h-40 w-[70%] select-none rounded-2xl border border-gray-border bg-white p-4 shadow-sm",
        dragDisabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        isDragging && "scale-[0.99] opacity-70 shadow-md",
        isDropTarget &&
          "ring-2 ring-brand-green ring-offset-2 ring-offset-white",
      )}
      aria-grabbed={isDragging}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-red text-xs font-bold text-white"
            aria-label={`${orderIndex}번째 장소`}
          >
            {orderIndex}
          </span>
          <h3 className="min-w-0 flex-1 pt-0.5 text-base font-semibold leading-snug text-gray-900">
            {place.title}
          </h3>
        </div>
        {place.subtitle ? (
          <p className="text-sm leading-relaxed text-dark-gray">
            {place.subtitle}
          </p>
        ) : null}
        {scheduleTimeEdit && typeof place.itemId === "number" ? (
          <PlanItemTimeForm
            roomId={scheduleTimeEdit.roomId}
            scheduleId={scheduleTimeEdit.scheduleId}
            itemId={place.itemId}
            startTime={
              place.startTime ?? slotStartTimeHm(scheduleTimeEdit.slotIndex)
            }
            durationMinutes={place.durationMinutes ?? 0}
          />
        ) : null}
      </div>

      <div className="absolute bottom-0 left-[102%] top-0 w-[164px] shrink-0">
        <div className="relative h-full min-h-40 overflow-hidden rounded-xl bg-light-gray">
          <Image
            src={imageSrc}
            alt={place.title}
            fill
            className="object-cover"
            sizes="140px"
            draggable={false}
          />
        </div>
      </div>
    </article>
  );
}
