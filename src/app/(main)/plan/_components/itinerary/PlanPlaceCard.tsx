"use client";

import type { DragEvent } from "react";
import { useCallback, useRef } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useDeleteScheduleItem } from "@/hooks/useRooms";
import { usePlanPlaceCardPhoto } from "@/hooks/usePlanPlaceCardPhoto";
import { normalizeGooglePlaceResourceId } from "@/lib/maps";
import { PLAN_PLACE_CARD_TW } from "@/lib/layout-tokens";
import type { PlanPlace } from "@/lib/plan/types";
import { cn } from "@/lib/utils";

import { PlanItemTimeForm } from "./PlanItemTimeForm";
import {
  PlanOrderIndexBadge,
  PlanPlaceCardTimeCell,
  PlanScheduleItemDeleteButton,
} from "./PlanPlaceCardParts";

export type PlanPlaceCardProps = {
  place: PlanPlace;
  orderIndex: number;
  orderBadgeColor?: string;
  isDragging: boolean;
  isDropTarget: boolean;
  dragDisabled?: boolean;
  scheduleTimeEdit?: {
    roomId: string;
    scheduleId: number;
  };
  scheduleOverlapWarning?: string;
  onDragStart: (e: DragEvent<Element>) => void;
  onDragEnd: (e: DragEvent<Element>) => void;
  onDragOver: (e: DragEvent<Element>) => void;
  onDragLeave: (e: DragEvent<Element>) => void;
  onDrop: (e: DragEvent<Element>) => void;
};

export function PlanPlaceCard({
  place,
  orderIndex,
  orderBadgeColor,
  isDragging,
  isDropTarget,
  dragDisabled = false,
  scheduleTimeEdit,
  scheduleOverlapWarning,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: PlanPlaceCardProps) {
  const { setSelectedPlace } = useSelectedPlace();
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const { resolvedPhotoUrl, photoLoading } = usePlanPlaceCardPhoto(place);

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

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const start = pointerDownRef.current;
      pointerDownRef.current = null;
      if (start) {
        const moved =
          Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y);
        if (moved > 12) return;
      }
      const loc = place.location;
      if (
        !loc ||
        typeof loc.lat !== "number" ||
        typeof loc.lng !== "number" ||
        !Number.isFinite(loc.lat) ||
        !Number.isFinite(loc.lng)
      ) {
        toast.info("지도에 표시할 위치 정보가 없어요.");
        return;
      }
      const rawId =
        typeof place.googlePlaceId === "string"
          ? place.googlePlaceId.trim()
          : "";
      const gid =
        rawId.length > 0 ? normalizeGooglePlaceResourceId(rawId) : undefined;

      setSelectedPlace({
        name: place.title,
        category: "",
        rating: null,
        ...(gid ? { googlePlaceId: gid } : {}),
        location: { lat: loc.lat, lng: loc.lng },
        address: place.subtitle,
      });
    },
    [
      place.googlePlaceId,
      place.location,
      place.subtitle,
      place.title,
      setSelectedPlace,
    ],
  );

  const timeForm =
    scheduleTimeEdit && typeof place.itemId === "number" ? (
      <PlanItemTimeForm
        key={`${scheduleTimeEdit.scheduleId}-${place.itemId}`}
        roomId={scheduleTimeEdit.roomId}
        scheduleId={scheduleTimeEdit.scheduleId}
        itemId={place.itemId}
        startTime={place.startTime ?? ""}
        durationMinutes={place.durationMinutes ?? 0}
        scheduleOverlapWarning={scheduleOverlapWarning}
      />
    ) : null;

  const deleteButton =
    canManageServerItem ? (
      <PlanScheduleItemDeleteButton
        disabled={isDeletingItem}
        onDelete={() => void handleDeleteScheduleItem()}
      />
    ) : null;

  return (
    <article
      draggable={!dragDisabled}
      onPointerDown={handlePointerDown}
      onDragStart={dragDisabled ? undefined : onDragStart}
      onDragEnd={dragDisabled ? undefined : onDragEnd}
      onDragOver={dragDisabled ? undefined : onDragOver}
      onDragLeave={dragDisabled ? undefined : onDragLeave}
      onDrop={dragDisabled ? undefined : onDrop}
      onClick={handleCardClick}
      className={cn(
        "w-full select-none",
        PLAN_PLACE_CARD_TW.article,
        dragDisabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-70 shadow-md",
        isDropTarget &&
          "ring-2 ring-brand-green ring-offset-2 ring-offset-white",
      )}
      aria-grabbed={isDragging}
    >
      <div className={PLAN_PLACE_CARD_TW.thumbnail}>
        {photoLoading ? (
          <Loader2
            className="absolute inset-0 m-auto h-5 w-5 animate-spin text-brand-green @min-[370px]/plan:h-6 @min-[370px]/plan:w-6"
            aria-hidden
          />
        ) : resolvedPhotoUrl ? (
          <Image
            src={resolvedPhotoUrl}
            alt={place.title}
            fill
            className="object-cover"
            sizes="(min-width: 400px) 120px, 80px"
            draggable={false}
          />
        ) : null}
      </div>

      <div className={PLAN_PLACE_CARD_TW.infoColumn}>
        <div className={PLAN_PLACE_CARD_TW.infoStack}>
          <div
            className={cn(
              "flex min-w-0 items-center gap-1.5 @min-[370px]/plan:gap-2",
              PLAN_PLACE_CARD_TW.titleNarrowOnly,
            )}
          >
            <PlanOrderIndexBadge
              orderIndex={orderIndex}
              backgroundColorHex={orderBadgeColor}
            />
            <h3
              className={cn(
                "min-w-0 flex-1 truncate font-semibold leading-snug text-gray-900",
                PLAN_PLACE_CARD_TW.titleCompact,
              )}
              title={place.title}
            >
              {place.title}
            </h3>
            {deleteButton}
          </div>

          <div
            className={cn(
              "min-w-0 w-full grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-1 items-start gap-x-2 gap-y-1",
              PLAN_PLACE_CARD_TW.titleWideOnly,
            )}
          >
            <PlanOrderIndexBadge
              orderIndex={orderIndex}
              backgroundColorHex={orderBadgeColor}
              className="col-start-1 row-start-1"
            />
            {canManageServerItem ? (
              <PlanScheduleItemDeleteButton
                disabled={isDeletingItem}
                gridPlacementClassName="col-start-3 row-start-1"
                onDelete={() => void handleDeleteScheduleItem()}
              />
            ) : null}
            <h3
              className={cn(
                "col-start-2 row-start-1 min-w-0 font-semibold leading-snug text-gray-900 break-keep text-pretty",
                PLAN_PLACE_CARD_TW.titleCompact,
                PLAN_PLACE_CARD_TW.titleClampWide,
              )}
            >
              {place.title}
            </h3>
          </div>

          {place.subtitle ? (
            <p
              className={cn(
                "break-keep",
                PLAN_PLACE_CARD_TW.subtitleCompact,
                PLAN_PLACE_CARD_TW.subtitleClampWide,
              )}
            >
              {place.subtitle}
            </p>
          ) : null}
        </div>
      </div>

      {timeForm ? <PlanPlaceCardTimeCell>{timeForm}</PlanPlaceCardTimeCell> : null}
    </article>
  );
}
