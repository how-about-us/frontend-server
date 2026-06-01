import type { ActiveSearchMapPin } from "@/lib/query-keys";
import { useSearchMapPinsStore } from "@/stores/search-map-pins-store";

export function setActiveSearchMapPins(pins: ActiveSearchMapPin[]): void {
  useSearchMapPinsStore.getState().setPins(pins);
}

export function clearActiveSearchMapPins(): void {
  useSearchMapPinsStore.getState().clearPins();
}

export function placeSearchResultsToMapPins(
  results: ReadonlyArray<{
    googlePlaceId: string;
    name: string;
    location: { lat: number; lng: number };
  }>,
): ActiveSearchMapPin[] {
  return results.map((r) => ({
    googlePlaceId: r.googlePlaceId,
    name: r.name,
    lat: r.location.lat,
    lng: r.location.lng,
  }));
}
