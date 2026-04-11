"use client";

import { useRef } from "react";
import Map from "@/components/ui/Map";
import { PlaceDetailPanel } from "@/components/PlaceDetailPanel";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";

export function MapWithDetailPanel() {
  const { selectedPlace, setSelectedPlace } = useSelectedPlace();

  // Keep the last place mounted during the slide-out animation
  const lastPlaceRef = useRef(selectedPlace);
  if (selectedPlace) lastPlaceRef.current = selectedPlace;

  return (
    <section className="relative hidden h-full min-w-s1 flex-1 overflow-hidden border-l border-gray-border s1:flex">
      <Map />

      {/* Detail panel – slides in from the left over the map */}
      <div
        className={`absolute bottom-3 top-15 left-2 z-20 flex w-[300px] flex-col rounded-xl overflow-hidden shadow-[6px_0_24px_-4px_rgba(0,0,0,0.12),16px_0_32px_-6px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out ${
          selectedPlace
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-[350px] pointer-events-none"
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
