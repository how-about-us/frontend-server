"use client";

import { Fragment, useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PlacesSearchInput } from "@/components/search/PlacesSearchInput";
import {
  useCreateScheduleItem,
  useSchedulePlanPlaces,
} from "@/hooks/useRooms";
import { useMapCenter } from "@/contexts/MapCenterContext";
import { getMockTravelMinutes } from "@/lib/plan/mockTravelDuration";
import type { PlanPlace } from "@/mocks/plan";

import { PlanPlaceCard } from "./PlanPlaceCard";
import { PlanTravelTime } from "./PlanTravelTime";

const INDEX_MIME = "application/x-plan-place-index";

function newPlaceId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `place-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function reorder<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list;
  }
  const next = [...list];
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

export type PlanItineraryProps =
  | {
      places: PlanPlace[];
      onPlacesChange: (next: PlanPlace[]) => void;
      roomId?: undefined;
      scheduleId?: undefined;
      scheduleDateYmd?: undefined;
    }
  | {
      roomId: string;
      scheduleId: number;
      scheduleDateYmd: string;
      places?: undefined;
      onPlacesChange?: undefined;
    };

export function PlanItinerary(props: PlanItineraryProps) {
  if (
    props.roomId != null &&
    props.scheduleId != null &&
    props.scheduleDateYmd != null
  ) {
    return (
      <PlanItineraryServerSynced
        roomId={props.roomId}
        scheduleId={props.scheduleId}
        scheduleDateYmd={props.scheduleDateYmd}
      />
    );
  }
  return (
    <PlanItineraryLocal
      places={props.places}
      onPlacesChange={props.onPlacesChange}
    />
  );
}

function PlanItineraryLocal({
  places,
  onPlacesChange,
}: {
  places: PlanPlace[];
  onPlacesChange: (next: PlanPlace[]) => void;
}) {
  const { mapCenter } = useMapCenter();
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handlePickPrediction = useCallback(
    (prediction: google.maps.places.AutocompletePrediction) => {
      const googlePlaceId = prediction.place_id;
      if (!googlePlaceId) {
        toast.error("장소 식별 정보를 찾을 수 없어요.");
        return;
      }
      const { main_text, secondary_text } = prediction.structured_formatting;
      onPlacesChange([
        ...places,
        {
          id: newPlaceId(),
          title: main_text,
          subtitle: secondary_text || undefined,
          googlePlaceId,
        },
      ]);
    },
    [onPlacesChange, places],
  );

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData(INDEX_MIME, String(index));
    e.dataTransfer.setData("text/plain", places[index]?.title ?? "");
  }, [places]);

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    setOverIndex(null);
  }, []);

  const handleDragOver = useCallback(
    (index: number, e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (draggingIndex !== null && index !== draggingIndex) {
        setOverIndex(index);
      }
    },
    [draggingIndex],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (dropIndex: number, e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(INDEX_MIME);
      const parsed = raw !== "" ? Number.parseInt(raw, 10) : NaN;
      const from = Number.isNaN(parsed) ? draggingIndex : parsed;
      if (from === null || Number.isNaN(from)) {
        handleDragEnd();
        return;
      }
      onPlacesChange(reorder(places, from, dropIndex));
      handleDragEnd();
    },
    [draggingIndex, handleDragEnd, onPlacesChange, places],
  );

  return (
    <div>
      {places.length === 0 ? (
        <p className="py-4 text-center text-sm text-dark-gray">
          아직 등록된 장소가 없습니다. 아래에서 추가해 보세요.
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {places.map((place, index) => (
          <Fragment key={place.id}>
            <PlanPlaceCard
              place={place}
              orderIndex={index + 1}
              isDragging={draggingIndex === index}
              isDropTarget={
                overIndex === index &&
                draggingIndex !== null &&
                draggingIndex !== index
              }
              onDragStart={(e) => handleDragStart(index, e)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(index, e)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(index, e)}
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
          onSearch={() => {}}
          onPickPrediction={handlePickPrediction}
        />
      </div>
    </div>
  );
}

function PlanItineraryServerSynced({
  roomId,
  scheduleId,
  scheduleDateYmd,
}: {
  roomId: string;
  scheduleId: number;
  scheduleDateYmd: string;
}) {
  const { mapCenter } = useMapCenter();
  const { data: places = [], isPending, isError } = useSchedulePlanPlaces(
    roomId,
    scheduleId,
  );
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
          scheduleDateYmd,
          googlePlaceId,
          nextSlotIndex: places.length,
        });
      } catch {
        toast.error("장소를 일정에 추가하지 못했어요.");
      }
    },
    [createItem, places.length, roomId, scheduleDateYmd, scheduleId],
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
