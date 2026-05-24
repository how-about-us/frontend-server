"use client";

import { useCallback, useState, type DragEvent } from "react";
import { toast } from "sonner";

import { useDragAutoScroll } from "@/hooks/useDragAutoScroll";
import { useReorderScheduleItem } from "@/hooks/useRooms";
import {
  beginPlanItemDrag,
  readPlanItemDragIndex,
} from "@/lib/plan/planItemDnD";
import { newOrderIndexAfterMove } from "@/lib/plan/scheduleItemPlaces";
import type { PlanPlace } from "@/lib/plan/types";

type UsePlanItineraryReorderArgs = {
  roomId: string;
  scheduleId: number;
  places: PlanPlace[];
  /** 장소 추가 등 D&D 외 상호작용 잠금 */
  interactionLocked?: boolean;
};

export function usePlanItineraryReorder({
  roomId,
  scheduleId,
  places,
  interactionLocked = false,
}: UsePlanItineraryReorderArgs) {
  const { mutateAsync: reorderMutate, isReorderSettling } =
    useReorderScheduleItem();
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);

  const dragLocked =
    interactionLocked || isReorderSettling || places.length < 2;
  useDragAutoScroll({ active: dragFromIndex !== null });

  const handleDragStart = useCallback(
    (index: number) => (e: DragEvent<Element>) => {
      if (dragLocked || typeof places[index]?.itemId !== "number") return;
      const target = e.currentTarget;
      if (target instanceof HTMLElement) {
        beginPlanItemDrag(e.nativeEvent, target, index);
      }
      setDragFromIndex(index);
    },
    [dragLocked, places],
  );

  const handleDragEnd = useCallback(() => {
    setDragFromIndex(null);
    setDropTargetIndex(null);
  }, []);

  const handleDragOver = useCallback(
    (index: number) => (e: DragEvent<Element>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropTargetIndex(index);
    },
    [],
  );

  const handleDragLeave = useCallback(
    (index: number) => (e: DragEvent<Element>) => {
      const next = e.relatedTarget as Node | null;
      if (next && e.currentTarget.contains(next)) return;
      setDropTargetIndex((t) => (t === index ? null : t));
    },
    [],
  );

  const handleDrop = useCallback(
    (toIndex: number) => async (e: DragEvent<Element>) => {
      e.preventDefault();
      const fromIndex = readPlanItemDragIndex(e.dataTransfer);

      setDropTargetIndex(null);
      setDragFromIndex(null);

      if (
        !Number.isFinite(fromIndex) ||
        fromIndex < 0 ||
        fromIndex >= places.length ||
        fromIndex === toIndex
      ) {
        return;
      }

      const itemId = places[fromIndex]?.itemId;
      if (typeof itemId !== "number") return;

      try {
        await reorderMutate({
          roomId,
          scheduleId,
          itemId,
          body: {
            newOrderIndex: newOrderIndexAfterMove(
              fromIndex,
              toIndex,
              places.length,
            ),
          },
        });
      } catch {
        toast.error("순서를 바꾸지 못했어요.");
      }
    },
    [places, reorderMutate, roomId, scheduleId],
  );

  const getCardDragProps = useCallback(
    (index: number) => ({
      dragDisabled: dragLocked || typeof places[index]?.itemId !== "number",
      isDragging: dragFromIndex === index,
      isDropTarget:
        dropTargetIndex === index &&
        dragFromIndex !== null &&
        dragFromIndex !== index,
      onDragStart: handleDragStart(index),
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver(index),
      onDragLeave: handleDragLeave(index),
      onDrop: handleDrop(index),
    }),
    [
      dragFromIndex,
      dragLocked,
      dropTargetIndex,
      handleDragEnd,
      handleDragLeave,
      handleDragOver,
      handleDragStart,
      handleDrop,
      places,
    ],
  );

  return { getCardDragProps, isReorderSettling };
}
