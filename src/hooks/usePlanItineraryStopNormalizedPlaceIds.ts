"use client";

import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { useRoomSchedules } from "@/hooks/useRooms";
import { normalizeGooglePlaceResourceId } from "@/lib/maps";
import { readSchedulePlanPlacesFromCache } from "@/lib/plan/scheduleItemPlaces";
import { scheduleItemsQueryKey } from "@/lib/query-keys";
import { usePlanItineraryExpandedStore } from "@/stores/plan-itinerary-expanded-store";
import { useSessionStore } from "@/stores/session-store";

const EMPTY = new Set<string>();

/** 펼친 일차 일정 장소의 정규화된 `googlePlaceId` (북마크 핀 중복 숨김용). */
export function usePlanItineraryStopNormalizedPlaceIds(
  enabled: boolean,
): ReadonlySet<string> {
  const roomIdRaw = useSessionStore((s) => s.currentRoomId);
  const rid = typeof roomIdRaw === "string" ? roomIdRaw.trim() : "";
  const queryClient = useQueryClient();
  const { isSuccess: schedulesHydrated } = useRoomSchedules(rid || null);

  const expandedByScheduleId = usePlanItineraryExpandedStore(
    (s) => s.expandedByScheduleId,
  );
  const expandedScheduleIds = useMemo(
    () =>
      Object.keys(expandedByScheduleId)
        .map((k) => Number(k))
        .filter(
          (id) => Number.isFinite(id) && expandedByScheduleId[id] === true,
        ),
    [expandedByScheduleId],
  );

  const orderedScheduleIdsForQueries = useMemo(
    () => [...expandedScheduleIds].sort((a, b) => a - b),
    [expandedScheduleIds],
  );

  const placesQueries = useQueries({
    queries: orderedScheduleIdsForQueries.map((scheduleId) => ({
      queryKey: scheduleItemsQueryKey(rid || null, scheduleId),
      queryFn: () => readSchedulePlanPlacesFromCache(queryClient, rid, scheduleId),
      enabled:
        enabled &&
        rid.length > 0 &&
        orderedScheduleIdsForQueries.length > 0 &&
        schedulesHydrated,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })),
  });

  return useMemo(() => {
    if (!enabled || rid.length === 0) return EMPTY;

    const ids = new Set<string>();
    orderedScheduleIdsForQueries.forEach((_, bucketIdx) => {
      const places = placesQueries[bucketIdx]?.data ?? [];
      for (const place of places) {
        const gid =
          typeof place.googlePlaceId === "string"
            ? place.googlePlaceId.trim()
            : "";
        if (!gid.length) continue;
        ids.add(normalizeGooglePlaceResourceId(gid));
      }
    });
    return ids;
  }, [enabled, rid, orderedScheduleIdsForQueries, placesQueries]);
}
