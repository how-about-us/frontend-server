"use client";

import type { DragEvent } from "react";
import { GripVertical } from "lucide-react";

import type { PlanPlace } from "@/mocks/plan";
import { cn } from "@/lib/utils";

export type PlanPlaceCardProps = {
  place: PlanPlace;
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
  isDragging,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: PlanPlaceCardProps) {
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "flex cursor-grab items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-[box-shadow,opacity,transform,border-color] active:cursor-grabbing",
        "border-gray-border select-none",
        isDragging && "scale-[0.98] opacity-60 shadow-md ring-2 ring-brand-green/40",
        isDropTarget && "ring-2 ring-brand-green ring-offset-2 ring-offset-white",
      )}
      aria-grabbed={isDragging}
    >
      <span
        className="touch-none text-dark-gray/50"
        aria-hidden
      >
        <GripVertical className="h-5 w-5 shrink-0" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-gray-900">{place.title}</h3>
        {place.subtitle ? (
          <p className="mt-0.5 truncate text-xs text-dark-gray">{place.subtitle}</p>
        ) : null}
      </div>
    </article>
  );
}
