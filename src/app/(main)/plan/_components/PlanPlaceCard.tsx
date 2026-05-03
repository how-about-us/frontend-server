"use client";

import type { DragEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getPlacePhotoUrl } from "@/lib/api/places";
import { useDeleteScheduleItem } from "@/hooks/useRooms";
import type { PlanPlace } from "@/lib/plan/types";
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
  const fallbackPhotoUrl =
    typeof place.imageUrl === "string" && place.imageUrl.trim().length > 0
      ? place.imageUrl.trim()
      : null;
  const photoName =
    typeof place.photoName === "string" && place.photoName.trim().length > 0
      ? place.photoName.trim()
      : null;

  const [resolvedPhotoUrl, setResolvedPhotoUrl] = useState<string | null>(() =>
    !photoName ? fallbackPhotoUrl : null,
  );
  const [photoLoading, setPhotoLoading] = useState(Boolean(photoName));

  useEffect(() => {
    if (!photoName) {
      setResolvedPhotoUrl(fallbackPhotoUrl);
      setPhotoLoading(false);
      return;
    }

    let cancelled = false;
    setPhotoLoading(true);
    setResolvedPhotoUrl(null);

    void getPlacePhotoUrl(photoName)
      .then((url) => {
        if (cancelled) return;
        const t = url?.trim();
        setResolvedPhotoUrl(t || fallbackPhotoUrl);
      })
      .catch(() => {
        if (!cancelled) setResolvedPhotoUrl(fallbackPhotoUrl);
      })
      .finally(() => {
        if (!cancelled) setPhotoLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [photoName, fallbackPhotoUrl]);

  const { mutateAsync: removeScheduleItemMutate, isPending: isDeletingItem } =
    useDeleteScheduleItem();

  const canManageServerItem =
    Boolean(scheduleTimeEdit) && typeof place.itemId === "number";

  const handleDeleteScheduleItem = useCallback(async () => {
    if (!scheduleTimeEdit || typeof place.itemId !== "number") return;
    if (!confirm("이 장소를 일정에서 삭제할까요?")) return;
    try {
      await removeScheduleItemMutate({
        roomId: scheduleTimeEdit.roomId,
        scheduleId: scheduleTimeEdit.scheduleId,
        itemId: place.itemId,
      });
      toast.success("일정에서 삭제했어요.");
    } catch {
      toast.error("삭제하지 못했어요.");
    }
  }, [scheduleTimeEdit, place.itemId, removeScheduleItemMutate]);

  return (
    <article
      draggable={!dragDisabled}
      onDragStart={dragDisabled ? undefined : onDragStart}
      onDragEnd={dragDisabled ? undefined : onDragEnd}
      onDragOver={dragDisabled ? undefined : onDragOver}
      onDragLeave={dragDisabled ? undefined : onDragLeave}
      onDrop={dragDisabled ? undefined : onDrop}
      className={cn(
        "relative flex min-h-40 w-[50%] select-none rounded-2xl border border-gray-border bg-white p-4 shadow-sm",
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
          {canManageServerItem ? (
            <button
              type="button"
              className="-mr-1 -mt-0.5 shrink-0 rounded-lg p-1.5 text-dark-gray transition hover:bg-brand-red/10 hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="일정에서 삭제"
              disabled={isDeletingItem}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                void handleDeleteScheduleItem();
              }}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
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

      <div className="absolute bottom-0 left-[102%] top-0 w-[100%] shrink-0">
        <div className="relative flex h-full min-h-40 items-center justify-center overflow-hidden rounded-xl bg-brand-green/30">
          {photoLoading ? (
            <Loader2
              className="h-6 w-6 animate-spin text-brand-green"
              aria-hidden
            />
          ) : resolvedPhotoUrl ? (
            <Image
              src={resolvedPhotoUrl}
              alt={place.title}
              fill
              className="object-cover"
              sizes="140px"
              draggable={false}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
