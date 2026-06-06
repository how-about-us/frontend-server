import { create } from "zustand";

type PlanItemCrossDayDragState = {
  sourceScheduleId: number | null;
  hoverTargetScheduleId: number | null;
  beginItemDrag: (sourceScheduleId: number) => void;
  setHoverTarget: (scheduleId: number | null) => void;
  endItemDrag: () => void;
};

export const usePlanItemCrossDayDragStore = create<PlanItemCrossDayDragState>(
  (set) => ({
    sourceScheduleId: null,
    hoverTargetScheduleId: null,
    beginItemDrag: (sourceScheduleId) => {
      if (!Number.isFinite(sourceScheduleId)) return;
      set({ sourceScheduleId, hoverTargetScheduleId: null });
    },
    setHoverTarget: (scheduleId) => {
      set((s) => {
        if (scheduleId === s.hoverTargetScheduleId) return s;
        return { hoverTargetScheduleId: scheduleId };
      });
    },
    endItemDrag: () => {
      set({ sourceScheduleId: null, hoverTargetScheduleId: null });
    },
  }),
);
