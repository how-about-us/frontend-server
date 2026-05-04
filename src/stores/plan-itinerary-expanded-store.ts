import { create } from "zustand";

/**
 * 일차(`scheduleId`) 펼침 — 맵 경로 오버레이와 동일 스토어 사용.
 * 활성 일차 집합은 `syncScheduleExpansionState`로 동기화(삭제 반영·신규 일차 기본 펼침).
 */
type ExpandedState = {
  expandedByScheduleId: Record<number, boolean>;
  setScheduleExpanded: (scheduleId: number, expanded: boolean) => void;
  syncScheduleExpansionState: (activeScheduleIds: readonly number[]) => void;
};

export const usePlanItineraryExpandedStore = create<ExpandedState>((set) => ({
  expandedByScheduleId: {},
  setScheduleExpanded: (scheduleId, expanded) => {
    if (!Number.isFinite(scheduleId)) return;
    set((s) => ({
      expandedByScheduleId: {
        ...s.expandedByScheduleId,
        [scheduleId]: expanded,
      },
    }));
  },
  syncScheduleExpansionState: (activeScheduleIds) => {
    set((s) => {
      const next: Record<number, boolean> = {};
      for (const id of activeScheduleIds) {
        if (!Number.isFinite(id)) continue;
        next[id] = s.expandedByScheduleId[id] ?? true;
      }
      return { expandedByScheduleId: next };
    });
  },
}));
