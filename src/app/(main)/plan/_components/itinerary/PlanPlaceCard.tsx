"use client";

import type { DragEvent } from "react";
import { useCallback, useRef } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { usePlanMobileReadOnly } from "@/hooks/usePlanMobileReadOnly";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useDeleteScheduleItem } from "@/hooks/useRooms";
import { usePlanPlaceCardPhoto } from "@/hooks/usePlanPlaceCardPhoto";
import { normalizeGooglePlaceResourceId } from "@/lib/maps";
import { PLAN_PLACE_CARD_TW } from "@/lib/layout-tokens";
import type { PlanPlace } from "@/lib/plan/types";
import { cn } from "@/lib/utils";

import { PlanItemMemoForm, PlanItemMemoReadOnly } from "./PlanItemMemoForm";
import { PlanItemTimeForm, PlanItemTimeReadOnly } from "./PlanItemTimeForm";
import {
  isPlanPlaceCardInteractiveTarget,
  PlanOrderIndexBadge,
  PlanPlaceCardControlsStack,
  PlanScheduleItemDeleteButton,
} from "./PlanPlaceCardParts";

export type PlanPlaceCardProps = {
  place: PlanPlace;
  displayOrderIndex: number;
  orderBadgeColor?: string;
  isDragging: boolean;
  dragDisabled?: boolean;
  scheduleTimeEdit?: {
    roomId: string;
    scheduleId: number;
  };
  scheduleOverlapWarning?: string;
  onDragStart: (e: DragEvent<Element>) => void;
  onDragEnd: (e: DragEvent<Element>) => void;
};

export function PlanPlaceCard({
  place,
  displayOrderIndex,
  orderBadgeColor,
  isDragging,
  dragDisabled = false,
  scheduleTimeEdit,
  scheduleOverlapWarning,
  onDragStart,
  onDragEnd,
}: PlanPlaceCardProps) {
  const { isReadOnly } = usePlanMobileReadOnly();
  const { setSelectedPlace } = useSelectedPlace();
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const blockCardDragRef = useRef(false);
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

  const handlePointerDownCapture = useCallback((e: React.PointerEvent) => {
    blockCardDragRef.current = isPlanPlaceCardInteractiveTarget(e.target);
    if (isReadOnly || blockCardDragRef.current) return;
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  }, [isReadOnly]);

  const handleDragStart = useCallback(
    (e: DragEvent<Element>) => {
      if (blockCardDragRef.current) {
        blockCardDragRef.current = false;
        e.preventDefault();
        return;
      }
      onDragStart(e);
    },
    [onDragStart],
  );

  const handleDragEnd = useCallback(
    (e: DragEvent<Element>) => {
      blockCardDragRef.current = false;
      onDragEnd(e);
    },
    [onDragEnd],
  );

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (isReadOnly) return;
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
      isReadOnly,
      place.googlePlaceId,
      place.location,
      place.subtitle,
      place.title,
      setSelectedPlace,
    ],
  );

  const scheduleItemId =
    scheduleTimeEdit && typeof place.itemId === "number" ? place.itemId : null;

  const scheduleControls =
    scheduleTimeEdit && scheduleItemId !== null ?
      !isReadOnly ?
        <PlanPlaceCardControlsStack>
          <PlanItemTimeForm
            key={`time-${scheduleTimeEdit.scheduleId}-${scheduleItemId}`}
            roomId={scheduleTimeEdit.roomId}
            scheduleId={scheduleTimeEdit.scheduleId}
            itemId={scheduleItemId}
            startTime={place.startTime ?? ""}
            durationMinutes={place.durationMinutes ?? 0}
            scheduleOverlapWarning={scheduleOverlapWarning}
          />
          <PlanItemMemoForm
            key={`memo-${scheduleTimeEdit.scheduleId}-${scheduleItemId}`}
            roomId={scheduleTimeEdit.roomId}
            scheduleId={scheduleTimeEdit.scheduleId}
            itemId={scheduleItemId}
            memo={place.memo}
          />
        </PlanPlaceCardControlsStack>
      : <PlanPlaceCardControlsStack>
          <PlanItemTimeReadOnly
            startTime={place.startTime ?? ""}
            durationMinutes={place.durationMinutes ?? 0}
          />
          {place.memo ?
            <PlanItemMemoReadOnly memo={place.memo} />
          : null}
        </PlanPlaceCardControlsStack>
    : null;

  const deleteButton =
    canManageServerItem ? (
      <PlanScheduleItemDeleteButton
        disabled={isDeletingItem}
        onDelete={() => void handleDeleteScheduleItem()}
      />
    ) : null;

  return (
    <article
      draggable={!dragDisabled && !isReadOnly}
      onPointerDownCapture={isReadOnly ? undefined : handlePointerDownCapture}
      onDragStart={dragDisabled || isReadOnly ? undefined : handleDragStart}
      onDragEnd={dragDisabled || isReadOnly ? undefined : handleDragEnd}
      onClick={isReadOnly ? undefined : handleCardClick}
      className={cn(
        "w-full select-none",
        PLAN_PLACE_CARD_TW.article,
        dragDisabled || isReadOnly
          ? "cursor-default"
          : "cursor-grab active:cursor-grabbing",
      )}
      aria-grabbed={isDragging}
    >
      <PlanOrderIndexBadge
        orderIndex={displayOrderIndex}
        backgroundColorHex={orderBadgeColor}
      />

      <div className={PLAN_PLACE_CARD_TW.thumbnail}>
        {photoLoading ? (
          <Loader2
            className="absolute inset-0 m-auto h-5 w-5 animate-spin text-brand-green"
            aria-hidden
          />
        ) : resolvedPhotoUrl ? (
          <Image
            src={resolvedPhotoUrl}
            alt={place.title}
            fill
            className="object-cover"
            sizes="112px"
            draggable={false}
          />
        ) : null}
      </div>

      <div className={PLAN_PLACE_CARD_TW.contentColumn}>
        <div className={PLAN_PLACE_CARD_TW.titleRow}>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex min-w-0 items-baseline gap-1.5">
              <h3
                className={cn(
                  "min-w-0 flex-1",
                  PLAN_PLACE_CARD_TW.titleCompact,
                  PLAN_PLACE_CARD_TW.titleClamp,
                )}
                title={place.title}
              >
                {place.title}
              </h3>
              {place.primaryTypeDisplayName ? (
                <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium leading-none text-dark-gray">
                  {place.primaryTypeDisplayName}
                </span>
              ) : null}
            </div>

            {place.subtitle ?
              <p
                className={cn(
                  PLAN_PLACE_CARD_TW.subtitle,
                  PLAN_PLACE_CARD_TW.subtitleClamp,
                )}
                title={place.subtitle}
              >
                {place.subtitle}
              </p>
            : null}
          </div>
          {deleteButton ?
            <span className="flex shrink-0 self-start">{deleteButton}</span>
          : null}
        </div>

        {scheduleControls}
      </div>
    </article>
  );
}
