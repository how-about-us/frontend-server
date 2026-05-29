"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { toast } from "sonner";

import { useDragAutoScroll } from "@/hooks/useDragAutoScroll";
import { useReorderScheduleItem } from "@/hooks/useRooms";
import {
  beginPlanItemDrag,
  computeDisplayOrderIndex,
  computeRowTranslateY,
  getPlanItemRowReorderStyle,
  PlanItemRowLayoutSnapshot,
  readPlanItemDragIndex,
} from "@/lib/plan/planItemReorder";
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
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const layoutSnapshotRef = useRef(new PlanItemRowLayoutSnapshot());
  const pointerYRef = useRef(0);
  const dragOverRafRef = useRef(0);

  const dragLocked =
    interactionLocked || isReorderSettling || places.length < 2;
  const isDraggingActive = dragFromIndex !== null;

  useDragAutoScroll({ active: isDraggingActive });

  const resetDragPreview = useCallback(() => {
    setDragFromIndex(null);
    setPreviewIndex(null);
    layoutSnapshotRef.current.clear();
  }, []);

  const setRowRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      rowRefs.current[index] = el;
    },
    [],
  );

  const updatePreviewFromPointer = useCallback(() => {
    if (dragFromIndex === null || layoutSnapshotRef.current.isEmpty) return;

    const nextPreview = layoutSnapshotRef.current.previewIndexAt(
      pointerYRef.current,
    );
    setPreviewIndex((prev) => (prev === nextPreview ? prev : nextPreview));
  }, [dragFromIndex]);

  const schedulePreviewUpdate = useCallback(() => {
    if (dragOverRafRef.current) return;
    dragOverRafRef.current = requestAnimationFrame(() => {
      dragOverRafRef.current = 0;
      updatePreviewFromPointer();
    });
  }, [updatePreviewFromPointer]);

  useEffect(() => {
    return () => {
      if (dragOverRafRef.current) {
        cancelAnimationFrame(dragOverRafRef.current);
      }
    };
  }, []);

  const handleDragStart = useCallback(
    (index: number) => (e: DragEvent<Element>) => {
      if (dragLocked || typeof places[index]?.itemId !== "number") return;
      const target = e.currentTarget;
      if (target instanceof HTMLElement) {
        beginPlanItemDrag(e.nativeEvent, target, index);
      }
      layoutSnapshotRef.current.capture(rowRefs.current);
      setDragFromIndex(index);
      setPreviewIndex(index);
    },
    [dragLocked, places],
  );

  const handleDragEnd = useCallback(() => {
    if (dragOverRafRef.current) {
      cancelAnimationFrame(dragOverRafRef.current);
      dragOverRafRef.current = 0;
    }
    resetDragPreview();
  }, [resetDragPreview]);

  const handleListDragOver = useCallback(
    (e: DragEvent<Element>) => {
      if (dragLocked || dragFromIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      pointerYRef.current = e.clientY;
      schedulePreviewUpdate();
    },
    [dragFromIndex, dragLocked, schedulePreviewUpdate],
  );

  const handleListDragLeave = useCallback(
    (e: DragEvent<Element>) => {
      const next = e.relatedTarget as Node | null;
      if (next && e.currentTarget.contains(next)) return;
      if (dragFromIndex === null) return;
      setPreviewIndex(dragFromIndex);
    },
    [dragFromIndex],
  );

  const handleListDrop = useCallback(
    async (e: DragEvent<Element>) => {
      e.preventDefault();

      const fromIndex = readPlanItemDragIndex(e.dataTransfer);
      const toIndex =
        previewIndex ??
        (Number.isFinite(fromIndex) ? fromIndex : null);

      resetDragPreview();

      if (
        !Number.isFinite(fromIndex) ||
        fromIndex < 0 ||
        fromIndex >= places.length ||
        toIndex === null ||
        toIndex < 0 ||
        toIndex >= places.length ||
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
    [places, previewIndex, reorderMutate, resetDragPreview, roomId, scheduleId],
  );

  const getRowProps = useCallback(
    (index: number, motionEnabled: boolean) => {
      const fromIdx = dragFromIndex;
      const previewIdx = previewIndex;
      const snapshot = layoutSnapshotRef.current;

      let translateY = 0;
      if (
        fromIdx !== null &&
        previewIdx !== null &&
        fromIdx !== previewIdx &&
        !snapshot.isEmpty
      ) {
        translateY = computeRowTranslateY(
          index,
          fromIdx,
          previewIdx,
          snapshot.heights(),
        );
      }

      const isDragging = fromIdx === index;
      const displayOrderIndex =
        fromIdx !== null && previewIdx !== null
          ? computeDisplayOrderIndex(
              index,
              fromIdx,
              previewIdx,
              places.length,
            )
          : index + 1;

      return {
        ref: setRowRef(index),
        style: getPlanItemRowReorderStyle({
          translateY,
          isDragging,
          motionEnabled,
        }),
        placeCardDragProps: {
          displayOrderIndex,
          isDragging,
          dragDisabled:
            dragLocked || typeof places[index]?.itemId !== "number",
          onDragStart: handleDragStart(index),
          onDragEnd: handleDragEnd,
        },
      };
    },
    [
      dragFromIndex,
      dragLocked,
      handleDragEnd,
      handleDragStart,
      places,
      previewIndex,
      setRowRef,
    ],
  );

  const listContainerProps = {
    onDragOver: dragLocked ? undefined : handleListDragOver,
    onDragLeave: dragLocked ? undefined : handleListDragLeave,
    onDrop: dragLocked ? undefined : handleListDrop,
  };

  return {
    getRowProps,
    listContainerProps,
    isDraggingActive,
    isReorderSettling,
  };
}
