"use client";

import { useCallback, useRef, useState } from "react";

import { PlaceDetailPanel } from "@/components/place/PlaceDetailPanel";
import { MapToolbarLayoutProvider } from "@/contexts/MapToolbarLayoutContext";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useMapDiscoverToolbarOffset } from "@/hooks/useMapDiscoverToolbarOffset";

import Map from "./Map";

export function MapWithDetailPanel() {
  const { selectedPlace, setSelectedPlace } = useSelectedPlace();

  const [mapSectionEl, setMapSectionEl] = useState<HTMLElement | null>(null);
  const setMapSectionRef = useCallback((el: HTMLElement | null) => {
    setMapSectionEl(el);
  }, []);

  const { setToolbarRef, panelTopPx } =
    useMapDiscoverToolbarOffset(mapSectionEl);

  // Keep the last place mounted during the slide-out animation
  const lastPlaceRef = useRef(selectedPlace);
  if (selectedPlace) lastPlaceRef.current = selectedPlace;

  return (
    <section
      ref={setMapSectionRef}
      className="relative hidden h-full min-h-0 min-w-0 flex-1 basis-0 overflow-hidden border-l border-gray-border s1:flex"
    >
      <MapToolbarLayoutProvider setToolbarRef={setToolbarRef}>
        <Map />
      </MapToolbarLayoutProvider>

      {/* Detail panel – slides in from the left over the map */}
      <div
        style={{ top: panelTopPx }}
        className={`absolute bottom-3 left-2 z-20 flex w-[360px] flex-col overflow-hidden rounded-xl shadow-[6px_0_24px_-4px_rgba(0,0,0,0.12),16px_0_32px_-6px_rgba(0,0,0,0.08)] transition-[transform,top] duration-300 ease-out ${
          selectedPlace
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none -translate-x-[400px]"
        }`}
      >
        {lastPlaceRef.current && (
          <PlaceDetailPanel
            {...lastPlaceRef.current}
            onClose={() => setSelectedPlace(null)}
          />
        )}
      </div>
    </section>
  );
}
