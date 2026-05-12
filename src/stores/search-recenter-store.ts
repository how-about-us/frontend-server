import { create } from "zustand";

import type { MapCenterCoords } from "./map-center-store";

export type SearchMapSnapshot = {
  center: MapCenterCoords;
  zoom: number | null;
  radius: number;
};

/** 카테고리 기반 탐색(Places JS) 검색 영역 고정 스냅샷 — bounds는 Text Search 영역 포함에 사용 */
export type DiscoverMapSnapshot = SearchMapSnapshot & {
  bounds: google.maps.LatLngBoundsLiteral;
};

type SearchRecenterState = {
  searchSnapshot: SearchMapSnapshot | null;
  discoverSnapshot: DiscoverMapSnapshot | null;
  recenterRequestId: number;
  setSearchSnapshot: (snapshot: SearchMapSnapshot | null) => void;
  clearSearchSnapshot: () => void;
  setDiscoverSnapshot: (snapshot: DiscoverMapSnapshot | null) => void;
  clearDiscoverSnapshot: () => void;
  requestRecenter: () => void;
};

export const useSearchRecenterStore = create<SearchRecenterState>((set) => ({
  searchSnapshot: null,
  discoverSnapshot: null,
  recenterRequestId: 0,
  setSearchSnapshot: (searchSnapshot) => set({ searchSnapshot }),
  clearSearchSnapshot: () => set({ searchSnapshot: null }),
  setDiscoverSnapshot: (discoverSnapshot) => set({ discoverSnapshot }),
  clearDiscoverSnapshot: () => set({ discoverSnapshot: null }),
  requestRecenter: () =>
    set((s) => ({ recenterRequestId: s.recenterRequestId + 1 })),
}));
