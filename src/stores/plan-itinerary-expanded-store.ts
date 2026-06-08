import { create } from "zustand";

/**
 * 일차(`scheduleId`) 펼침 — 맵 경로 오버레이와 동일 스토어 사용.
 * 활성 일차 집합은 `syncScheduleExpansionState`로 동기화(삭제 반영·신규 일차 기본 펼침).
 * `expansionOrder`는 펼침(true) 토글 순서(뒤쪽일수록 최근) — 겹치는 지도 핀 우선순위에 사용.
 */
type ExpandedState = {
  expandedByScheduleId: Record<number, boolean>;
  /** `setScheduleExpanded(..., true)` 호출 순서 (접힌 일차는 제거) */
  expansionOrder: number[];
  setScheduleExpanded: (scheduleId: number, expanded: boolean) => void;
  syncScheduleExpansionState: (activeScheduleIds: readonly number[]) => void;
  /** 방 전환 시 이전 방 scheduleId로 맵·일정 쿼리가 먼저 도는 것을 방지 */
  resetForRoomChange: () => void;
};

function appendExpansionOrder(order: number[], scheduleId: number): number[] {
  const without = order.filter((id) => id !== scheduleId);
  return [...without, scheduleId];
}

function removeExpansionOrder(order: number[], scheduleId: number): number[] {
  return order.filter((id) => id !== scheduleId);
}

export const usePlanItineraryExpandedStore = create<ExpandedState>((set) => ({
  expandedByScheduleId: {},
  expansionOrder: [],
  setScheduleExpanded: (scheduleId, expanded) => {
    if (!Number.isFinite(scheduleId)) return;
    set((s) => {
      const expansionOrder = expanded
        ? appendExpansionOrder(s.expansionOrder, scheduleId)
        : removeExpansionOrder(s.expansionOrder, scheduleId);
      return {
        expandedByScheduleId: {
          ...s.expandedByScheduleId,
          [scheduleId]: expanded,
        },
        expansionOrder,
      };
    });
  },
  syncScheduleExpansionState: (activeScheduleIds) => {
    set((s) => {
      const activeSet = new Set(
        activeScheduleIds.filter((id) => Number.isFinite(id)),
      );
      const next: Record<number, boolean> = {};
      let expansionOrder = s.expansionOrder.filter((id) => activeSet.has(id));

      for (const id of activeScheduleIds) {
        if (!Number.isFinite(id)) continue;
        const hadKey = id in s.expandedByScheduleId;
        const expanded = s.expandedByScheduleId[id] ?? true;
        next[id] = expanded;
        if (!hadKey && expanded) {
          expansionOrder = appendExpansionOrder(expansionOrder, id);
        }
      }

      return { expandedByScheduleId: next, expansionOrder };
    });
  },
  resetForRoomChange: () => {
    set({ expandedByScheduleId: {}, expansionOrder: [] });
  },
}));
