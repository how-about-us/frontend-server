"use client";

import type { DragEvent } from "react";
import { useCallback, useRef } from "react";
import Image from "next/image";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useDeleteScheduleItem } from "@/hooks/useRooms";
import { usePlacePhotoUrlQuery } from "@/hooks/usePlacePhotoUrl";
import { normalizeGooglePlaceResourceId } from "@/lib/maps";
import { PLAN_PLACE_CARD_WIDE_TW } from "@/lib/layout-tokens";
import type { PlanPlace } from "@/lib/plan/types";
import { cn } from "@/lib/utils";

import { PlanItemTimeForm } from "./PlanItemTimeForm";

export type PlanPlaceCardProps = {
  place: PlanPlace;
  /** 카드에 표시하는 순번 (1부터) */
  orderIndex: number;
  /** 일차별 지도 경로·핀 색과 동기화 (`#RRGGBB`) — 없으면 brand-red 배지 */
  orderBadgeColor?: string;
  isDragging: boolean;
  isDropTarget: boolean;
  /** 서버 동기화 일정에서는 순서 변경 비활성화 */
  dragDisabled?: boolean;
  /** `itemId`가 있을 때 카드 안에서 일정 시간 편집 */
  scheduleTimeEdit?: {
    roomId: string;
    scheduleId: number;
  };
  /** 인접 일정 시간 겹침 안내 — 시간 폼에 표시 */
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

  const fallbackPhotoUrl =
    typeof place.imageUrl === "string" && place.imageUrl.trim().length > 0
      ? place.imageUrl.trim()
      : null;
  const photoName =
    typeof place.photoName === "string" && place.photoName.trim().length > 0
      ? place.photoName.trim()
      : null;

  const photoQuery = usePlacePhotoUrlQuery(photoName);
  const resolvedPhotoUrl = photoName
    ? (photoQuery.data?.trim() || fallbackPhotoUrl)
    : fallbackPhotoUrl;
  const photoLoading = Boolean(photoName) && photoQuery.isPending;

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
        "flex w-full select-none flex-col gap-3 rounded-2xl border border-gray-border bg-white p-4 shadow-sm",
        PLAN_PLACE_CARD_WIDE_TW.articleFlexWide,
        dragDisabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
        isDragging && "scale-[0.99] opacity-70 shadow-md",
        isDropTarget &&
          "ring-2 ring-brand-green ring-offset-2 ring-offset-white",
      )}
      aria-grabbed={isDragging}
    >
      <div
        className={cn(
          "relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-green/30",
          "mx-auto self-start",
          PLAN_PLACE_CARD_WIDE_TW.thumbnailWide,
        )}
      >
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
            sizes="120px"
            draggable={false}
          />
        ) : null}
      </div>

      <div className="flex min-w-0 w-full flex-1 flex-col gap-2">
        {/* 좁은 컨테이너: 순번 · 제목(truncate) · 삭제 한 행 */}
        <div
          className={cn(
            "flex min-w-0 items-center gap-2",
            PLAN_PLACE_CARD_WIDE_TW.narrowTitleRowWideHidden,
          )}
        >
          <PlanOrderIndexBadge
            orderIndex={orderIndex}
            backgroundColorHex={orderBadgeColor}
          />
          <h3
            className="min-w-0 flex-1 truncate pt-0.5 text-base font-semibold leading-snug text-gray-900"
            title={place.title}
          >
            {place.title}
          </h3>
          {canManageServerItem ? (
            <PlanScheduleItemDeleteButton
              disabled={isDeletingItem}
              onDelete={() => void handleDeleteScheduleItem()}
            />
          ) : null}
        </div>

        {/* 넓은 컨테이너: 기존 그리드(제목 줄바꿈) */}
        <div
          className={cn(
            "hidden min-w-0 w-full grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-1 items-start gap-x-2 gap-y-1",
            PLAN_PLACE_CARD_WIDE_TW.wideTitleGridWide,
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
          <h3 className="col-start-2 row-start-1 min-w-0 pt-0.5 text-base font-semibold leading-snug text-gray-900 break-keep text-pretty">
            {place.title}
          </h3>
        </div>
        {place.subtitle ? (
          <p className="text-xs leading-relaxed text-dark-gray break-keep">
            {place.subtitle}
          </p>
        ) : null}
        {scheduleTimeEdit && typeof place.itemId === "number" ? (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <PlanItemTimeForm
              key={`${scheduleTimeEdit.scheduleId}-${place.itemId}`}
              roomId={scheduleTimeEdit.roomId}
              scheduleId={scheduleTimeEdit.scheduleId}
              itemId={place.itemId}
              startTime={place.startTime ?? ""}
              durationMinutes={place.durationMinutes ?? 0}
              scheduleOverlapWarning={scheduleOverlapWarning}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}

function PlanOrderIndexBadge({
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
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white",
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

function PlanScheduleItemDeleteButton({
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
        "-mr-1 -mt-0.5 shrink-0 rounded-lg p-1.5 text-dark-gray transition hover:bg-brand-red/10 hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-40",
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
      <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
    </button>
  );
}
