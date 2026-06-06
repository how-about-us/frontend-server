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
import {
  useMoveScheduleItemToSchedule,
  useReorderScheduleItem,
} from "@/hooks/useRooms";
import {
  beginPlanItemDrag,
  clampCrossDayTargetOrderIndex,
  computeDisplayOrderIndex,
  computeRowTranslateY,
  executePlanItemCrossDayMove,
  getPlanItemRowReorderStyle,
  isPlanItemDrag,
  PlanItemRowLayoutSnapshot,
  readPlanItemDragIndex,
} from "@/lib/plan/planItemReorder";
import { newOrderIndexAfterMove } from "@/lib/plan/scheduleItemPlaces";
import type { PlanPlace } from "@/lib/plan/types";
import { usePlanItemCrossDayDragStore } from "@/stores/plan-item-cross-day-drag-store";

type UsePlanItineraryReorderArgs = {
  roomId: string;
  scheduleId: number;
  places: PlanPlace[];
  /** 장소 추가 등 D&D 외 상호작용 잠금 */
  interactionLocked?: boolean;
};

function normalizeSameDayDropIndex(
  previewIndex: number | null,
  placesLength: number,
): number | null {
  if (previewIndex === null || !Number.isFinite(previewIndex)) return null;
  if (placesLength <= 0) return 0;
  if (previewIndex >= placesLength) return placesLength - 1;
  return previewIndex;
}

export function usePlanItineraryReorder({
  roomId,
  scheduleId,
  places,
  interactionLocked = false,
}: UsePlanItineraryReorderArgs) {
  const { mutateAsync: reorderMutate, isReorderSettling } =
    useReorderScheduleItem();
  const { mutateAsync: moveMutate, isPending: isMovePending } =
    useMoveScheduleItemToSchedule();
  const beginItemDrag = usePlanItemCrossDayDragStore((s) => s.beginItemDrag);
  const setHoverTarget = usePlanItemCrossDayDragStore((s) => s.setHoverTarget);
  const endItemDrag = usePlanItemCrossDayDragStore((s) => s.endItemDrag);

  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [incomingExternalDrag, setIncomingExternalDrag] = useState(false);

  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const layoutSnapshotRef = useRef(new PlanItemRowLayoutSnapshot());
  const pointerYRef = useRef(0);
  const dragOverRafRef = useRef(0);

  const mutationLocked =
    interactionLocked || isReorderSettling || isMovePending;
  const isDraggingActive = dragFromIndex !== null || incomingExternalDrag;

  useDragAutoScroll({ active: isDraggingActive });

  const resetDragPreview = useCallback(() => {
    setDragFromIndex(null);
    setPreviewIndex(null);
    setIncomingExternalDrag(false);
    layoutSnapshotRef.current.clear();
    endItemDrag();
  }, [endItemDrag]);

  const setRowRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      rowRefs.current[index] = el;
    },
    [],
  );

  const updatePreviewFromPointer = useCallback(() => {
    if (layoutSnapshotRef.current.isEmpty) return;
    if (dragFromIndex === null && !incomingExternalDrag) return;

    const nextPreview = layoutSnapshotRef.current.previewIndexAt(
      pointerYRef.current,
    );
    setPreviewIndex((prev) => (prev === nextPreview ? prev : nextPreview));
  }, [dragFromIndex, incomingExternalDrag]);

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
      const itemId = places[index]?.itemId;
      if (mutationLocked || typeof itemId !== "number") return;
      const target = e.currentTarget;
      if (target instanceof HTMLElement) {
        beginPlanItemDrag(e.nativeEvent, target, index, {
          scheduleId,
          itemId,
        });
      }
      beginItemDrag(scheduleId);
      layoutSnapshotRef.current.capture(rowRefs.current);
      setDragFromIndex(index);
      setPreviewIndex(index);
    },
    [beginItemDrag, mutationLocked, places, scheduleId],
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
      if (mutationLocked) return;

      const external = dragFromIndex === null && isPlanItemDrag(e.dataTransfer);
      if (dragFromIndex === null && !external) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      pointerYRef.current = e.clientY;

      if (external) {
        setHoverTarget(scheduleId);
        if (layoutSnapshotRef.current.isEmpty) {
          layoutSnapshotRef.current.capture(rowRefs.current);
          setIncomingExternalDrag(true);
          setPreviewIndex(
            places.length > 0
              ? layoutSnapshotRef.current.previewIndexAt(e.clientY)
              : 0,
          );
        }
      }

      schedulePreviewUpdate();
    },
    [
      dragFromIndex,
      mutationLocked,
      places.length,
      scheduleId,
      schedulePreviewUpdate,
      setHoverTarget,
    ],
  );

  const handleListDragLeave = useCallback(
    (e: DragEvent<Element>) => {
      const next = e.relatedTarget as Node | null;
      if (next && e.currentTarget.contains(next)) return;

      if (incomingExternalDrag) {
        setIncomingExternalDrag(false);
        setPreviewIndex(null);
        layoutSnapshotRef.current.clear();
        setHoverTarget(null);
        return;
      }

      if (dragFromIndex === null) return;
      setPreviewIndex(dragFromIndex);
    },
    [dragFromIndex, incomingExternalDrag, setHoverTarget],
  );

  const handleListDrop = useCallback(
    async (e: DragEvent<Element>) => {
      e.preventDefault();

      const dataTransfer = e.dataTransfer;
      const fromIndex = readPlanItemDragIndex(dataTransfer);
      const dropPreviewIndex =
        previewIndex ??
        (Number.isFinite(fromIndex) ? fromIndex : null);

      const crossDayHandled = await executePlanItemCrossDayMove({
        dataTransfer,
        roomId,
        targetScheduleId: scheduleId,
        targetOrderIndex: clampCrossDayTargetOrderIndex(
          dropPreviewIndex ?? 0,
          places.length,
        ),
        moveMutate,
        onError: (message) => toast.error(message),
      });

      resetDragPreview();

      if (crossDayHandled) return;

      const toIndex = normalizeSameDayDropIndex(dropPreviewIndex, places.length);

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
    [
      moveMutate,
      places,
      previewIndex,
      reorderMutate,
      resetDragPreview,
      roomId,
      scheduleId,
    ],
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
            mutationLocked || typeof places[index]?.itemId !== "number",
          onDragStart: handleDragStart(index),
          onDragEnd: handleDragEnd,
        },
      };
    },
    [
      dragFromIndex,
      handleDragEnd,
      handleDragStart,
      mutationLocked,
      places,
      previewIndex,
      setRowRef,
    ],
  );

  const listContainerProps = {
    onDragOver: mutationLocked ? undefined : handleListDragOver,
    onDragLeave: mutationLocked ? undefined : handleListDragLeave,
    onDrop: mutationLocked ? undefined : handleListDrop,
  };

  return {
    getRowProps,
    listContainerProps,
    isDraggingActive,
    isReorderSettling: isReorderSettling || isMovePending,
  };
}
