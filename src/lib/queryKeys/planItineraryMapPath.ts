export const PLAN_ITINERARY_MAP_PATH_CACHE_VERSION = "orient-v1" as const;

export function planItineraryMapPathQueryKey(
  rid: string,
  orderedScheduleIds: number[],
  directionsEpoch: number,
  segmentEpochSignature: string,
) {
  return [
    "plan-itinerary-map-path",
    PLAN_ITINERARY_MAP_PATH_CACHE_VERSION,
    rid,
    orderedScheduleIds,
    directionsEpoch,
    segmentEpochSignature,
  ] as const;
}
