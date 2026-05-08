import { create } from "zustand";

export type MapCenterCoords = { lat: number; lng: number };

type MapCenterState = {
  mapCenter: MapCenterCoords | null;
  setMapCenter: (center: MapCenterCoords) => void;
};

export const useMapCenterStore = create<MapCenterState>((set) => ({
  mapCenter: null,
  setMapCenter: (mapCenter) => set({ mapCenter }),
}));
