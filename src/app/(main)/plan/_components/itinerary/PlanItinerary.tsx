"use client";

import { Fragment, useCallback, useMemo, useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PlacesSearchInput } from "@/components/search/PlacesSearchInput";
import {
  useCreateScheduleItem,
  useSchedulePlanPlaces,
} from "@/hooks/useRooms";
import { usePlanItineraryReorder } from "@/hooks/usePlanItineraryReorder";
import { useMapCenterStore } from "@/stores/map-center-store";
import { defaultNewItemStartTimeHmFromPlanPlaces } from "@/lib/plan/scheduleItemPlaces";
import {
  formatAdjacentScheduleConflictMessage,
  getAdjacentScheduleConflictFlags,
} from "@/lib/plan/scheduleAdjacentConflicts";
import { schedulePlacesFingerprint } from "@/lib/plan/planTravelLocalStorage";
import { scheduleIdsToRouteColors } from "@/lib/plan/planRouteDayColors";
import { usePlanItineraryExpandedStore } from "@/stores/plan-itinerary-expanded-store";

import type { PlanPlace } from "@/lib/plan/types";

import { PlanTravelTime } from "../travel-time/PlanTravelTime";
import { AddFromBookmarkModal } from "./AddFromBookmarkModal";
import { PlanPlaceCard } from "./PlanPlaceCard";

const EMPTY_PLAN_PLACES: PlanPlace[] = [];

export type PlanItineraryProps = {
  roomId: string;
  scheduleId: number;
};

export function PlanItinerary({ roomId, scheduleId }: PlanItineraryProps) {
  const mapCenter = useMapCenterStore((s) => s.mapCenter);
  const expandedByScheduleId = usePlanItineraryExpandedStore(
    (s) => s.expandedByScheduleId,
  );
  const orderedExpandedScheduleIds = useMemo(
    () =>
      Object.keys(expandedByScheduleId)
        .map((k) => Number(k))
        .filter(
          (id) => Number.isFinite(id) && expandedByScheduleId[id] === true,
        )
        .sort((a, b) => a - b),
    [expandedByScheduleId],
  );
  const routeColorByScheduleId = useMemo(
    () =>
      scheduleIdsToRouteColors(
        orderedExpandedScheduleIds,
        roomId.trim() || undefined,
      ),
    [orderedExpandedScheduleIds, roomId],
  );
  const orderBadgeColor =
    routeColorByScheduleId.get(scheduleId) ?? "#f12d33";

  const {
    data: placesData,
    isLoading,
    isFetching: isFetchingPlaces,
    isError,
  } = useSchedulePlanPlaces(roomId, scheduleId);

  const places = placesData ?? EMPTY_PLAN_PLACES;

  const existingItemIds = useMemo(
    () =>
      new Set(
        places
          .map((p) => p.itemId)
          .filter((id): id is number => typeof id === "number"),
      ),
    [places],
  );
  const { mutateAsync: createItem, isPending: isAdding } =
    useCreateScheduleItem();

  const [bookmarkModalOpen, setBookmarkModalOpen] = useState(false);

  const { getCardDragProps, isReorderSettling } = usePlanItineraryReorder({
    roomId,
    scheduleId,
    places,
    interactionLocked: isAdding,
  });

  const handlePickPrediction = useCallback(
    async (prediction: google.maps.places.PlacePrediction) => {
      const googlePlaceId = prediction.placeId;
      if (!googlePlaceId) {
        toast.error("장소 식별 정보를 찾을 수 없어요.");
        return;
      }
      try {
        await createItem({
          roomId,
          scheduleId,
          googlePlaceId,
          startTimeHm: defaultNewItemStartTimeHmFromPlanPlaces(places),
        });
      } catch {
        toast.error("장소를 일정에 추가하지 못했어요.");
      }
    },
    [createItem, places, roomId, scheduleId],
  );

  const scheduleFingerprint = useMemo(
    () => schedulePlacesFingerprint(places),
    [places],
  );

  const scheduleConflictFlags = useMemo(
    () => getAdjacentScheduleConflictFlags(places),
    [places],
  );

  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-dark-gray">
          <Loader2 className="h-5 w-5 animate-spin text-brand-green" />
          <span className="text-sm">장소 목록을 불러오는 중…</span>
        </div>
      ) : null}

      {isError ? (
        <p className="py-4 text-center text-sm text-brand-red">
          장소 목록을 불러오지 못했어요.
        </p>
      ) : null}

      {!isLoading && places.length === 0 ? (
        <p className="py-4 text-center text-sm text-dark-gray">
          아직 등록된 장소가 없습니다. 검색으로 장소를 추가해 보세요.
        </p>
      ) : null}

      <div className="flex flex-col gap-0">
        {places.map((place, index) => (
          <Fragment key={place.id}>
            <PlanPlaceCard
              place={place}
              orderIndex={index + 1}
              orderBadgeColor={orderBadgeColor}
              scheduleTimeEdit={{ roomId, scheduleId }}
              scheduleOverlapWarning={
                isReorderSettling ?
                  undefined
                : formatAdjacentScheduleConflictMessage(
                    scheduleConflictFlags[index]!,
                  )
              }
              {...getCardDragProps(index)}
            />
            {index < places.length - 1 &&
            typeof place.itemId === "number" &&
            typeof places[index + 1]?.itemId === "number" ? (
              <PlanTravelTime
                roomId={roomId}
                scheduleId={scheduleId}
                segmentSourceItemId={place.itemId}
                scheduleFingerprint={scheduleFingerprint}
                routeQueryEnabled={
                  placesData !== undefined &&
                  !isFetchingPlaces &&
                  existingItemIds.has(place.itemId) &&
                  existingItemIds.has(places[index + 1].itemId!)
                }
              />
            ) : null}
          </Fragment>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-gray-border pt-4">
        <p className="text-xs font-medium text-dark-gray">장소 추가</p>
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <PlacesSearchInput
              coords={mapCenter}
              pickOnly
              disabled={isAdding}
              onSearch={() => {}}
              onPickPrediction={(p) => void handlePickPrediction(p)}
            />
          </div>
          <button
            type="button"
            aria-label="북마크에서 장소 추가"
            disabled={isAdding}
            onClick={() => setBookmarkModalOpen(true)}
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-border bg-white text-dark-gray shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Bookmark className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
        {isAdding ? (
          <p className="text-xs text-dark-gray">추가하는 중…</p>
        ) : null}
      </div>

      {bookmarkModalOpen ? (
        <AddFromBookmarkModal
          roomId={roomId}
          scheduleId={scheduleId}
          places={places}
          onClose={() => setBookmarkModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
