"use client";

import type { DragEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Clock, Loader2 } from "lucide-react";

import { MemoIcon } from "@/components/icons";
import { toast } from "sonner";

import { usePlanMobileReadOnly } from "@/hooks/usePlanMobileReadOnly";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import {
  useDeleteScheduleItem,
  useUpdateScheduleItem,
} from "@/hooks/useRooms";
import { usePlanPlaceCardPhoto } from "@/hooks/usePlanPlaceCardPhoto";
import { normalizeGooglePlaceResourceId } from "@/lib/maps";
import { PLAN_PLACE_CARD_TW } from "@/lib/layout-tokens";
import {
  formatScheduleStaySummary,
  formatScheduleTimeRange,
} from "@/lib/plan/scheduleTime";
import type { PlanPlace } from "@/lib/plan/types";
import { cn } from "@/lib/utils";

import { PlanItemMemoEditor, PlanItemMemoReadOnly } from "./PlanItemMemoForm";
import { PlanItemTimeEditor } from "./PlanItemTimeForm";
import {
  isPlanPlaceCardInteractiveTarget,
  PlanOrderIndexBadge,
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

function stopCardActivation(e: React.SyntheticEvent) {
  e.stopPropagation();
}

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

  const [memoOpen, setMemoOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  useEffect(() => {
    if (scheduleOverlapWarning) setTimeOpen(true);
  }, [scheduleOverlapWarning]);

  const { mutateAsync: removeScheduleItemMutate, isPending: isDeletingItem } =
    useDeleteScheduleItem();
  const { mutateAsync: updateScheduleItemMutate, isPending: isUpdatingItem } =
    useUpdateScheduleItem();

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

  const handleDeleteMemo = useCallback(async () => {
    if (!scheduleTimeEdit || typeof place.itemId !== "number") return;
    if (!confirm("메모를 삭제하시겠습니까?")) return;
    try {
      await updateScheduleItemMutate({
        roomId: scheduleTimeEdit.roomId,
        scheduleId: scheduleTimeEdit.scheduleId,
        itemId: place.itemId,
        body: { memo: "" },
      });
      toast.success("메모를 삭제했어요.");
    } catch {
      toast.error("메모를 삭제하지 못했어요.");
    }
  }, [scheduleTimeEdit, place.itemId, updateScheduleItemMutate]);

  const handlePointerDownCapture = useCallback(
    (e: React.PointerEvent) => {
      blockCardDragRef.current = isPlanPlaceCardInteractiveTarget(e.target);
      if (isReadOnly || blockCardDragRef.current) return;
      pointerDownRef.current = { x: e.clientX, y: e.clientY };
    },
    [isReadOnly],
  );

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

  const canEditScheduleItem =
    !isReadOnly && scheduleTimeEdit != null && scheduleItemId !== null;

  const memoText = typeof place.memo === "string" ? place.memo.trim() : "";
  const hasMemo = memoText.length > 0;
  const staySummary = formatScheduleStaySummary(
    place.startTime ?? "",
    place.durationMinutes ?? 0,
  );
  const timeRange = formatScheduleTimeRange(
    place.startTime ?? "",
    place.durationMinutes ?? 0,
  );
  const hasTime = Boolean(staySummary);

  const deleteButton = canManageServerItem ? (
    <PlanScheduleItemDeleteButton
      disabled={isDeletingItem}
      onDelete={() => void handleDeleteScheduleItem()}
    />
  ) : null;

  const memoTrigger = canEditScheduleItem ? (
    <button
      type="button"
      data-plan-card-no-drag
      onMouseDown={stopCardActivation}
      onClick={(e) => {
        stopCardActivation(e);
        setMemoOpen((v) => !v);
      }}
      aria-expanded={memoOpen}
      className={cn(
        PLAN_PLACE_CARD_TW.triggerButton,
        (memoOpen || hasMemo) && PLAN_PLACE_CARD_TW.triggerButtonActive,
      )}
    >
      <MemoIcon
        className={PLAN_PLACE_CARD_TW.triggerIcon}
        strokeWidth={2}
      />
      {hasMemo ? "메모 수정" : "메모 추가"}
    </button>
  ) : null;

  const timeTrigger = canEditScheduleItem ? (
    <button
      type="button"
      data-plan-card-no-drag
      onMouseDown={stopCardActivation}
      onClick={(e) => {
        stopCardActivation(e);
        setTimeOpen((v) => !v);
      }}
      aria-expanded={timeOpen}
      className={cn(
        PLAN_PLACE_CARD_TW.triggerButton,
        (timeOpen || hasTime) && PLAN_PLACE_CARD_TW.triggerButtonActive,
      )}
    >
      <Clock
        className={PLAN_PLACE_CARD_TW.triggerIcon}
        strokeWidth={2}
        aria-hidden
      />
      시간 설정
    </button>
  ) : null;

  return (
    <div className="flex w-full flex-col gap-2">
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
                  <span className={PLAN_PLACE_CARD_TW.primaryTypeBadge}>
                    {place.primaryTypeDisplayName}
                  </span>
                ) : null}
              </div>

              {place.subtitle ? (
                <p
                  className={cn(
                    PLAN_PLACE_CARD_TW.subtitle,
                    PLAN_PLACE_CARD_TW.subtitleClamp,
                  )}
                  title={place.subtitle}
                >
                  {place.subtitle}
                </p>
              ) : null}
            </div>
            {deleteButton ? (
              <span className="flex shrink-0 self-start">{deleteButton}</span>
            ) : null}
          </div>

          {timeRange ? (
            <span
              className={cn(
                "mt-auto inline-flex w-fit items-center rounded-md bg-brand-green/10 px-2 py-0.5",
                PLAN_PLACE_CARD_TW.titleCompact,
                "text-[14px] tabular-nums text-brand-green",
              )}
            >
              {timeRange}
            </span>
          ) : null}
        </div>

        {canEditScheduleItem ? (
          <div className={PLAN_PLACE_CARD_TW.triggerRow}>
            {memoTrigger}
            {timeTrigger}
          </div>
        ) : null}
      </article>

      {canEditScheduleItem && timeOpen && scheduleTimeEdit && scheduleItemId !== null ? (
        <PlanItemTimeEditor
          key={`time-${scheduleTimeEdit.scheduleId}-${scheduleItemId}`}
          roomId={scheduleTimeEdit.roomId}
          scheduleId={scheduleTimeEdit.scheduleId}
          itemId={scheduleItemId}
          startTime={place.startTime ?? ""}
          durationMinutes={place.durationMinutes ?? 0}
          scheduleOverlapWarning={scheduleOverlapWarning}
          onClose={() => setTimeOpen(false)}
        />
      ) : null}

      {canEditScheduleItem && memoOpen && scheduleTimeEdit && scheduleItemId !== null ? (
        <PlanItemMemoEditor
          key={`memo-${scheduleTimeEdit.scheduleId}-${scheduleItemId}`}
          roomId={scheduleTimeEdit.roomId}
          scheduleId={scheduleTimeEdit.scheduleId}
          itemId={scheduleItemId}
          memo={place.memo}
          onClose={() => setMemoOpen(false)}
        />
      ) : null}

      {hasMemo && !memoOpen ? (
        <PlanItemMemoReadOnly
          memo={memoText}
          onDelete={
            canEditScheduleItem ? () => void handleDeleteMemo() : undefined
          }
          isDeleting={isUpdatingItem}
        />
      ) : null}
    </div>
  );
}
