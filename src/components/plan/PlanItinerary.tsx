"use client";

import { Fragment, useCallback, useState } from "react";
import { Plus } from "lucide-react";

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

export type PlanItineraryProps = {
  initialPlaces: PlanPlace[];
};

export function PlanItinerary({ initialPlaces }: PlanItineraryProps) {
  const [places, setPlaces] = useState<PlanPlace[]>(initialPlaces);
  const [newTitle, setNewTitle] = useState("");
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleAddPlace = useCallback(() => {
    const title = newTitle.trim() || "새 장소";
    setPlaces((prev) => [
      ...prev,
      { id: newPlaceId(), title, subtitle: undefined },
    ]);
    setNewTitle("");
  }, [newTitle]);

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
      setPlaces((prev) => reorder(prev, from, dropIndex));
      handleDragEnd();
    },
    [draggingIndex, handleDragEnd],
  );

  return (
    <div className="space-y-0">
      {places.length === 0 ? (
        <p className="py-4 text-center text-sm text-dark-gray">
          아직 등록된 장소가 없습니다. 아래에서 추가해 보세요.
        </p>
      ) : null}

      {places.map((place, index) => (
        <Fragment key={place.id}>
          <PlanPlaceCard
            place={place}
            isDragging={draggingIndex === index}
            isDropTarget={
              overIndex === index && draggingIndex !== null && draggingIndex !== index
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

      <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-gray-border pt-4">
        <p className="text-xs font-medium text-dark-gray">장소 추가</p>
        <div className="flex flex-wrap items-stretch gap-2 sm:flex-nowrap">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddPlace();
              }
            }}
            placeholder="장소 이름 (비우면 ‘새 장소’)"
            className="min-h-11 min-w-0 flex-1 rounded-xl border border-gray-border bg-white px-3 text-sm text-gray-900 placeholder:text-dark-gray/50 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green/40"
          />
          <button
            type="button"
            onClick={handleAddPlace}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand-green px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" aria-hidden />
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
