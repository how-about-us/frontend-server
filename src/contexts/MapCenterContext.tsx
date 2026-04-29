"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { HIKONE_CENTER } from "@/mocks/map";

type LatLng = { lat: number; lng: number };

type MapCenterContextType = {
  mapCenter: LatLng;
  setMapCenter: (center: LatLng) => void;
};

const MapCenterContext = createContext<MapCenterContextType>({
  mapCenter: HIKONE_CENTER,
  setMapCenter: () => {},
});

export function MapCenterProvider({ children }: { children: ReactNode }) {
  const [mapCenter, setMapCenter] = useState<LatLng>(HIKONE_CENTER);

  return (
    <MapCenterContext.Provider value={{ mapCenter, setMapCenter }}>
      {children}
    </MapCenterContext.Provider>
  );
}

export function useMapCenter() {
  return useContext(MapCenterContext);
}
