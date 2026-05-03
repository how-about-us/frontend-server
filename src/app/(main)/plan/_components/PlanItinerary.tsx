"use client";

import { Fragment, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PlacesSearchInput } from "@/components/search/PlacesSearchInput";
import { useCreateScheduleItem, useSchedulePlanPlaces } from "@/hooks/useRooms";
import { useMapCenter } from "@/contexts/MapCenterContext";
import { getMockTravelMinutes } from "@/lib/plan/mockTravelDuration";

import { PlanPlaceCard } from "./PlanPlaceCard";
import { PlanTravelTime } from "./PlanTravelTime";

export type PlanItineraryProps = {
  roomId: string;
  scheduleId: number;
};

export function PlanItinerary({ roomId, scheduleId }: PlanItineraryProps) {
  const { mapCenter } = useMapCenter();
  const {
    data: places = [],
    isPending,
    isError,
  } = useSchedulePlanPlaces(roomId, scheduleId);
  const { mutateAsync: createItem, isPending: isAdding } =
    useCreateScheduleItem();

  const handlePickPrediction = useCallback(
    async (prediction: google.maps.places.AutocompletePrediction) => {
      const googlePlaceId = prediction.place_id;
      if (!googlePlaceId) {
        toast.error("장소 식별 정보를 찾을 수 없어요.");
        return;
      }
      try {
        await createItem({
          roomId,
          scheduleId,
          googlePlaceId,
          nextSlotIndex: places.length,
        });
      } catch {
        toast.error("장소를 일정에 추가하지 못했어요.");
      }
    },
    [createItem, places.length, roomId, scheduleId],
  );

  return (
    <div>
      {isPending ? (
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

      {!isPending && places.length === 0 ? (
        <p className="py-4 text-center text-sm text-dark-gray">
          아직 등록된 장소가 없습니다. 검색으로 장소를 추가해 보세요.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {places.map((place, index) => (
          <Fragment key={place.id}>
            <PlanPlaceCard
              place={place}
              orderIndex={index + 1}
              dragDisabled
              scheduleTimeEdit={{ roomId, scheduleId, slotIndex: index }}
              isDragging={false}
              isDropTarget={false}
              onDragStart={() => {}}
              onDragEnd={() => {}}
              onDragOver={() => {}}
              onDragLeave={() => {}}
              onDrop={() => {}}
            />
            {index < places.length - 1 ? (
              <PlanTravelTime
                fromPlace={place}
                toPlace={places[index + 1]}
                minutes={getMockTravelMinutes(place.id, places[index + 1].id)}
              />
            ) : null}
          </Fragment>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-gray-border pt-4">
        <p className="text-xs font-medium text-dark-gray">장소 추가</p>
        <PlacesSearchInput
          coords={mapCenter}
          pickOnly
          disabled={isAdding}
          onSearch={() => {}}
          onPickPrediction={(p) => void handlePickPrediction(p)}
        />
        {isAdding ? (
          <p className="text-xs text-dark-gray">추가하는 중…</p>
        ) : null}
      </div>
    </div>
  );
}
