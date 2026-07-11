import { create } from "zustand";

/**
 * 일차(`scheduleId`)별 "지도에 경로 표시" 스위치.
 * `PlanDaySection` 헤더의 경로 토글 버튼이 이 스토어를 사용합니다.
 * `PlanDaySection`의 펼침/접음(`usePlanItineraryExpandedStore`)과는 독립적으로 동작합니다.
 * `visibilityOrder`는 켠(true) 순서 (뒤쪽일수록 최근) — 겹치는 지도 핀 우선순위에 사용.
 */
type State = {
  visibleByScheduleId: Record<number, boolean>;
  /** `setRouteVisible(..., true)` 호출 순서 (끈 일차는 제거) */
  visibilityOrder: number[];
  setRouteVisible: (scheduleId: number, visible: boolean) => void;
  syncRouteVisibility: (activeScheduleIds: readonly number[]) => void;
  resetForRoomChange: () => void;
};

function appendOrder(order: number[], scheduleId: number): number[] {
  return [...order.filter((id) => id !== scheduleId), scheduleId];
}

function removeOrder(order: number[], scheduleId: number): number[] {
  return order.filter((id) => id !== scheduleId);
}

export const usePlanScheduleRouteVisibilityStore = create<State>((set) => ({
  visibleByScheduleId: {},
  visibilityOrder: [],
  setRouteVisible: (scheduleId, visible) => {
    if (!Number.isFinite(scheduleId)) return;
    set((s) => ({
      visibleByScheduleId: {
        ...s.visibleByScheduleId,
        [scheduleId]: visible,
      },
      visibilityOrder: visible
        ? appendOrder(s.visibilityOrder, scheduleId)
        : removeOrder(s.visibilityOrder, scheduleId),
    }));
  },
  syncRouteVisibility: (activeScheduleIds) => {
    set((s) => {
      const activeSet = new Set(
        activeScheduleIds.filter((id) => Number.isFinite(id)),
      );
      const next: Record<number, boolean> = {};
      let order = s.visibilityOrder.filter((id) => activeSet.has(id));

      for (const id of activeScheduleIds) {
        if (!Number.isFinite(id)) continue;
        const hadKey = id in s.visibleByScheduleId;
        const visible = s.visibleByScheduleId[id] ?? true;
        next[id] = visible;
        if (!hadKey && visible) order = appendOrder(order, id);
      }

      return { visibleByScheduleId: next, visibilityOrder: order };
    });
  },
  resetForRoomChange: () => {
    set({ visibleByScheduleId: {}, visibilityOrder: [] });
  },
}));
