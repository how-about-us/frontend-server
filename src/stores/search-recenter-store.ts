import { create } from "zustand";

import type { MapCenterCoords } from "./map-center-store";

export type SearchMapSnapshot = {
  center: MapCenterCoords;
  zoom: number | null;
  radius: number;
};

type SearchRecenterState = {
  searchSnapshot: SearchMapSnapshot | null;
  recenterRequestId: number;
  setSearchSnapshot: (snapshot: SearchMapSnapshot | null) => void;
  clearSearchSnapshot: () => void;
  requestRecenter: () => void;
};

export const useSearchRecenterStore = create<SearchRecenterState>((set) => ({
  searchSnapshot: null,
  recenterRequestId: 0,
  setSearchSnapshot: (searchSnapshot) => set({ searchSnapshot }),
  clearSearchSnapshot: () => set({ searchSnapshot: null }),
  requestRecenter: () =>
    set((s) => ({ recenterRequestId: s.recenterRequestId + 1 })),
}));
