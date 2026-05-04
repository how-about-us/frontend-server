import { create } from "zustand";

import { HIKONE_CENTER } from "@/mocks/map";

export type MapCenterCoords = { lat: number; lng: number };

type MapCenterState = {
  mapCenter: MapCenterCoords;
  setMapCenter: (center: MapCenterCoords) => void;
};

export const useMapCenterStore = create<MapCenterState>((set) => ({
  mapCenter: HIKONE_CENTER,
  setMapCenter: (mapCenter) => set({ mapCenter }),
}));
