import { create } from "zustand";

import type { ActiveSearchMapPin } from "@/lib/query-keys";

type SearchMapPinsState = {
  pins: ActiveSearchMapPin[];
  setPins: (pins: ActiveSearchMapPin[]) => void;
  clearPins: () => void;
};

export const useSearchMapPinsStore = create<SearchMapPinsState>((set) => ({
  pins: [],
  setPins: (pins) => set({ pins }),
  clearPins: () => set({ pins: [] }),
}));
