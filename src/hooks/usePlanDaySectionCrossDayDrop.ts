"use client";

import { useCallback, type DragEvent } from "react";
import { toast } from "sonner";

import { useMoveScheduleItemToSchedule } from "@/hooks/useRooms";
import {
  clampCrossDayTargetOrderIndex,
  executePlanItemCrossDayMove,
  isPlanItemDrag,
  PLAN_ITEM_ITINERARY_DROP_ZONE_ATTR,
} from "@/lib/plan/planItemReorder";
import { usePlanItemCrossDayDragStore } from "@/stores/plan-item-cross-day-drag-store";

type UsePlanDaySectionCrossDayDropArgs = {
  roomId: string;
  scheduleId: number;
  placesCount: number;
  interactionLocked?: boolean;
};

export function usePlanDaySectionCrossDayDrop({
  roomId,
  scheduleId,
  placesCount,
  interactionLocked = false,
}: UsePlanDaySectionCrossDayDropArgs) {
  const { mutateAsync: moveMutate, isPending: isMovePending } =
    useMoveScheduleItemToSchedule();
  const setHoverTarget = usePlanItemCrossDayDragStore((s) => s.setHoverTarget);
  const endItemDrag = usePlanItemCrossDayDragStore((s) => s.endItemDrag);
  const sourceScheduleId = usePlanItemCrossDayDragStore(
    (s) => s.sourceScheduleId,
  );

  const locked = interactionLocked || isMovePending;

  const handleSectionDragOver = useCallback(
    (e: DragEvent<Element>) => {
      if (locked) return;
      if (!isPlanItemDrag(e.dataTransfer)) return;
      if (sourceScheduleId === scheduleId) return;

      const target = e.target;
      if (
        target instanceof Element &&
        target.closest(`[${PLAN_ITEM_ITINERARY_DROP_ZONE_ATTR}]`)
      ) {
        return;
      }

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setHoverTarget(scheduleId);
    },
    [locked, scheduleId, setHoverTarget, sourceScheduleId],
  );

  const handleSectionDragLeave = useCallback(
    (e: DragEvent<Element>) => {
      const next = e.relatedTarget as Node | null;
      if (next && e.currentTarget.contains(next)) return;
      setHoverTarget(null);
    },
    [setHoverTarget],
  );

  const handleSectionDrop = useCallback(
    async (e: DragEvent<Element>) => {
      if (locked) return;
      if (!isPlanItemDrag(e.dataTransfer)) return;

      const target = e.target;
      if (
        target instanceof Element &&
        target.closest(`[${PLAN_ITEM_ITINERARY_DROP_ZONE_ATTR}]`)
      ) {
        return;
      }

      e.preventDefault();

      const handled = await executePlanItemCrossDayMove({
        dataTransfer: e.dataTransfer,
        roomId,
        targetScheduleId: scheduleId,
        targetOrderIndex: clampCrossDayTargetOrderIndex(0, placesCount),
        moveMutate,
        onError: (message) => toast.error(message),
      });

      endItemDrag();

      if (!handled) return;
    },
    [endItemDrag, locked, moveMutate, placesCount, roomId, scheduleId],
  );

  const crossDaySectionDropProps = locked
    ? undefined
    : {
        onDragOver: handleSectionDragOver,
        onDragLeave: handleSectionDragLeave,
        onDrop: handleSectionDrop,
      };

  return { crossDaySectionDropProps };
}
