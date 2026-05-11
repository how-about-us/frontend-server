import { create } from "zustand";

export type MapCenterCoords = { lat: number; lng: number };

type MapCenterState = {
  mapCenter: MapCenterCoords | null;
  zoom: number | null;
  /** 현재 뷰포트 기준 대략 반경(m): 중심 ↔ bounds 북동 코너 */
  radiusMeters: number | null;
  setMapCenter: (center: MapCenterCoords) => void;
  setMapCamera: (payload: {
    mapCenter: MapCenterCoords;
    zoom: number;
    radiusMeters: number;
  }) => void;
};

export const useMapCenterStore = create<MapCenterState>((set) => ({
  mapCenter: null,
  zoom: null,
  radiusMeters: null,
  setMapCenter: (mapCenter) => set({ mapCenter }),
  setMapCamera: ({ mapCenter, zoom, radiusMeters }) =>
    set({ mapCenter, zoom, radiusMeters }),
}));
