import { create } from "zustand";

import type { PlaceSearchResult } from "@/hooks/usePlacesSearch";

export type SearchMapPin = {
  googlePlaceId: string;
  name: string;
  lat: number;
  lng: number;
};

type SearchMapPinsState = {
  pins: SearchMapPin[];
  setSearchMapPinsFromResults: (results: PlaceSearchResult[]) => void;
  clearSearchMapPins: () => void;
};

function toPins(results: PlaceSearchResult[]): SearchMapPin[] {
  return results.map((r) => ({
    googlePlaceId: r.googlePlaceId,
    name: r.name,
    lat: r.location.lat,
    lng: r.location.lng,
  }));
}

export const useSearchMapPinsStore = create<SearchMapPinsState>((set) => ({
  pins: [],
  setSearchMapPinsFromResults: (results) => set({ pins: toPins(results) }),
  clearSearchMapPins: () => set({ pins: [] }),
}));
