"use client";

import { useCallback, useState } from "react";

import { PlaceDetailPanel } from "@/components/place/PlaceDetailPanel";
import { MapToolbarLayoutProvider } from "@/contexts/MapToolbarLayoutContext";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useMapDiscoverToolbarOffset } from "@/hooks/useMapDiscoverToolbarOffset";
import { cn } from "@/lib/utils";

import Map from "./Map";

export function MapWithDetailPanel({
  mobileInline = false,
}: {
  mobileInline?: boolean;
}) {
  const { selectedPlace, setSelectedPlace } = useSelectedPlace();

  const [mapSectionEl, setMapSectionEl] = useState<HTMLElement | null>(null);
  const setMapSectionRef = useCallback((el: HTMLElement | null) => {
    setMapSectionEl(el);
  }, []);

  const { setToolbarRef, panelTopPx } =
    useMapDiscoverToolbarOffset(mapSectionEl);

  return (
    <section
      ref={setMapSectionRef}
      className={cn(
        "relative h-full min-h-0 min-w-0 flex-1 basis-0 overflow-hidden",
        mobileInline
          ? "flex"
          : "hidden border-l border-gray-border s1:flex",
      )}
    >
      <MapToolbarLayoutProvider setToolbarRef={setToolbarRef}>
        <Map />
      </MapToolbarLayoutProvider>

      {/* Detail panel – slides in from the left over the map */}
      <div
        style={mobileInline ? undefined : { top: panelTopPx }}
        className={`absolute z-20 flex flex-col overflow-hidden shadow-[6px_0_24px_-4px_rgba(0,0,0,0.12),16px_0_32px_-6px_rgba(0,0,0,0.08)] transition-[transform,top] duration-300 ease-out ${
          mobileInline
            ? "inset-x-2 bottom-2 top-[72px] rounded-xl"
            : "bottom-3 left-2 w-[360px] rounded-xl"
        } ${
          selectedPlace
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none -translate-x-[400px]"
        }`}
      >
        {selectedPlace && (
          <PlaceDetailPanel
            {...selectedPlace}
            onClose={() => setSelectedPlace(null)}
          />
        )}
      </div>
    </section>
  );
}
