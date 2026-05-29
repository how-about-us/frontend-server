import { create } from "zustand";

/** 맵 결과 핀이 동시에 두 종류(Search / Discover)로 올라가지 않도록 마지막 트리거만 소유권 표시 */
export type MapPinsFocus = "search" | "discover" | null;

type MapPinsFocusState = {
  focus: MapPinsFocus;
  writeEpoch: number;
  /** Search 또는 Discover 요청 시작 시 호출 → focus 전환 및 epoch 증가, 새 epoch 반환 */
  claimFocus: (next: "search" | "discover") => number;
  /** 검색 패널이 결과 핀을 내릴 때 — search 소유였을 때만 해제해 Discover 소유 유지 */
  releaseSearchFocusIfActive: () => void;
  /** Discover 카테고리 해제 등 — 맵 핀 레이어 주장 완전 철회 + 비행 중 디스커버 응답 무효화 */
  releaseFocus: () => void;
};

export const useMapPinsFocusStore = create<MapPinsFocusState>((set, get) => ({
  focus: null,
  writeEpoch: 0,

  claimFocus: (next) => {
    const writeEpoch = get().writeEpoch + 1;
    set({ focus: next, writeEpoch });
    return writeEpoch;
  },

  releaseSearchFocusIfActive: () => {
    if (get().focus !== "search") return;
    const writeEpoch = get().writeEpoch + 1;
    set({ focus: null, writeEpoch });
  },

  releaseFocus: () => {
    const writeEpoch = get().writeEpoch + 1;
    set({ focus: null, writeEpoch });
  },
}));

/** Discover 비동기 완료 직후: 아직 디스커버가 소유자이며 동일 라운드(epoch)면 반영 허용 */
export function discoverPinWriteStillValid(epoch: number): boolean {
  const { focus, writeEpoch } = useMapPinsFocusStore.getState();
  return focus === "discover" && writeEpoch === epoch;
}

/** Search 비동기 완료 직후: 아직 검색이 소유자이며 동일 라운드(epoch)면 반영 허용 */
export function searchPinWriteStillValid(epoch: number): boolean {
  const { focus, writeEpoch } = useMapPinsFocusStore.getState();
  return focus === "search" && writeEpoch === epoch;
}
