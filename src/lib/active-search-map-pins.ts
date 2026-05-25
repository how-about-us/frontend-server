import type { QueryClient } from "@tanstack/react-query";

import {
  activeSearchMapPinsQueryKey,
  type ActiveSearchMapPin,
} from "@/lib/query-keys";

export function setActiveSearchMapPins(
  queryClient: QueryClient,
  pins: ActiveSearchMapPin[],
): void {
  queryClient.setQueryData(activeSearchMapPinsQueryKey, pins);
}

export function clearActiveSearchMapPins(queryClient: QueryClient): void {
  queryClient.setQueryData<ActiveSearchMapPin[]>(
    activeSearchMapPinsQueryKey,
    [],
  );
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
