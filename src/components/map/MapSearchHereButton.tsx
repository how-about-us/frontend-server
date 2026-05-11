"use client";

import { Search } from "lucide-react";

import { shouldSuggestPlacesSearchRecenter } from "@/lib/maps";
import { useMapCenterStore } from "@/stores/map-center-store";
import { useSearchRecenterStore } from "@/stores/search-recenter-store";

export function MapSearchHereButton() {
  const mapCenter = useMapCenterStore((s) => s.mapCenter);
  const zoom = useMapCenterStore((s) => s.zoom);
  const searchSnapshot = useSearchRecenterStore((s) => s.searchSnapshot);
  const requestRecenter = useSearchRecenterStore((s) => s.requestRecenter);

  if (!searchSnapshot || !mapCenter) return null;

  if (
    !shouldSuggestPlacesSearchRecenter({
      mapCenter,
      snapshotCenter: searchSnapshot.center,
      snapshotRadiusMeters: searchSnapshot.radius,
      zoom,
      snapshotZoom: searchSnapshot.zoom,
    })
  ) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute bottom-6 left-1/2 z-[17] -translate-x-1/2">
      <button
        type="button"
        onClick={() => requestRecenter()}
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-gray-border bg-white px-4 py-2.5 text-sm font-semibold text-dark-gray shadow-md ring-2 ring-black/5 transition hover:bg-gray-50"
      >
        <Search className="h-4 w-4 shrink-0 text-brand-green" strokeWidth={2.2} />
        현 위치 검색
      </button>
    </div>
  );
}
