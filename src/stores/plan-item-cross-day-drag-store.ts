import { create } from "zustand";

type PlanItemCrossDayDragState = {
  sourceScheduleId: number | null;
  hoverTargetScheduleId: number | null;
  /** 소스 행 높이 — 대상 일차 삽입 gap 애니메이션용 */
  draggedRowHeight: number | null;
  beginItemDrag: (sourceScheduleId: number, rowHeight: number) => void;
  setHoverTarget: (scheduleId: number | null) => void;
  endItemDrag: () => void;
};

export const usePlanItemCrossDayDragStore = create<PlanItemCrossDayDragState>(
  (set) => ({
    sourceScheduleId: null,
    hoverTargetScheduleId: null,
    draggedRowHeight: null,
    beginItemDrag: (sourceScheduleId, rowHeight) => {
      if (!Number.isFinite(sourceScheduleId)) return;
      set({
        sourceScheduleId,
        hoverTargetScheduleId: null,
        draggedRowHeight:
          Number.isFinite(rowHeight) && rowHeight > 0 ? rowHeight : null,
      });
    },
    setHoverTarget: (scheduleId) => {
      set((s) => {
        if (scheduleId === s.hoverTargetScheduleId) return s;
        return { hoverTargetScheduleId: scheduleId };
      });
    },
    endItemDrag: () => {
      set({
        sourceScheduleId: null,
        hoverTargetScheduleId: null,
        draggedRowHeight: null,
      });
    },
  }),
);
