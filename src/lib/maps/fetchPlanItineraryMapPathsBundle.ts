/// <reference types="google.maps" />

import type { QueryClient } from "@tanstack/react-query";

import {
  flattenPlanItinerarySegmentsFromPlaces,
  planItinerarySegmentPathRecordKey,
} from "@/lib/plan/planItineraryMapSegments";
import { fetchScheduleItemsAsPlanPlaces } from "@/lib/plan/scheduleItemPlaces";
import { scheduleItemsQueryKey } from "@/lib/queryKeys/scheduleItems";

import {
  fetchPlanSegmentPathLatLng,
  orientPathSmallerStopToLarger,
} from "./planItineraryDirectionsPath";

export async function fetchPlanItineraryMapPathsBundle(
  queryClient: QueryClient,
  rid: string,
  orderedScheduleIdsForQueries: number[],
): Promise<Record<string, google.maps.LatLngLiteral[]>> {
  const roomKey = rid.length > 0 ? rid : null;
  const placesBuckets = await Promise.all(
    orderedScheduleIdsForQueries.map((scheduleId) =>
      queryClient.fetchQuery({
        queryKey: scheduleItemsQueryKey(roomKey, scheduleId),
        queryFn: () =>
          rid.length === 0
            ? Promise.resolve([])
            : fetchScheduleItemsAsPlanPlaces(rid, scheduleId),
        staleTime: Infinity,
      }),
    ),
  );

  const segs = flattenPlanItinerarySegmentsFromPlaces(
    orderedScheduleIdsForQueries,
    placesBuckets,
  );

  const out: Record<string, google.maps.LatLngLiteral[]> = {};
  await Promise.all(
    segs.map(async (seg) => {
      const k = planItinerarySegmentPathRecordKey(seg);
      let pts = await fetchPlanSegmentPathLatLng(
        seg.originPlaceId,
        seg.destPlaceId,
        seg.travelModeCanon,
      );
      if (seg.originLocation && seg.destLocation && pts.length >= 2) {
        pts = orientPathSmallerStopToLarger(
          pts,
          seg.originLocation,
          seg.destLocation,
        );
      }
      out[k] = pts;
    }),
  );
  return out;
}
