"use client";

import type { DragEvent } from "react";
import Image from "next/image";

import type { PlanPlace } from "@/mocks/plan";
import { cn } from "@/lib/utils";

export type PlanPlaceCardProps = {
  place: PlanPlace;
  /** 카드에 표시하는 순번 (1부터) */
  orderIndex: number;
  isDragging: boolean;
  isDropTarget: boolean;
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
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative flex w-[70%] h-40 cursor-grab select-none rounded-2xl border border-gray-border bg-white p-4 shadow-sm active:cursor-grabbing",
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
      </div>

      <div className="absolute top-0 rounded-xl overflow-hidden left-[102%] h-40 w-[164px] shrink-0 bg-light-gray">
        <Image
          src={imageSrc}
          alt={place.title}
          fill
          className="object-cover"
          sizes="140px"
          draggable={false}
        />
      </div>
    </article>
  );
}
