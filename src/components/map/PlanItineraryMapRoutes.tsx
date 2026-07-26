"use client";

/// <reference types="google.maps" />

import { AdvancedMarker, Polyline } from "@vis.gl/react-google-maps";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, type JSX } from "react";

import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useRoomSchedules } from "@/hooks/useRooms";
import {
  buildPlanItineraryRouteConnectorDotIcons,
  buildPlanItineraryRouteConnectorPaths,
  buildPlanItineraryRouteArrowIcons,
  fetchOrientedPlanItinerarySegmentPath,
  normalizeGooglePlaceResourceId,
} from "@/lib/maps";
import { readSchedulePlanPlacesFromCache } from "@/lib/plan/scheduleItemPlaces";
import {
  scheduleIdsToRouteColors,
  sortedScheduleIdsForRouteColors,
} from "@/lib/plan/planRouteDayColors";
import {
  filterVisiblePlanMapStops,
  type PlanMapStopForOffset,
} from "@/lib/plan/planItineraryMapMarkerOffset";
import {
  flattenPlanItinerarySegmentsFromPlaces,
} from "@/lib/plan/planItineraryMapSegments";
import {
  planItinerarySegmentMapPathQueryKey,
  scheduleItemsQueryKey,
} from "@/lib/query-keys";
import {
  planMapSegmentEpochStoreKey,
  usePlanMapDirectionsEpochStore,
} from "@/stores/plan-map-directions-epoch-store";
import { usePlanScheduleRouteVisibilityStore } from "@/stores/plan-schedule-route-visibility-store";
import { useSessionStore } from "@/stores/session-store";

import { PlanItineraryStopMapPin } from "./PlanItineraryStopMapPin";

/**
 * 일차별 "지도에 경로 표시" 토글(`usePlanScheduleRouteVisibilityStore`) ON인
 * 일차만 지도에 경로(polyline)와 정류장 마커를 그립니다.
 * 폴리라인 travelMode는 서버에 저장된 구간별 공유 이동수단을 따릅니다.
 * STOMP 에폭은 {@link usePlanMapDirectionsEpochStore} 참고.
 */
export function PlanItineraryMapRoutes() {
  const roomIdRaw = useSessionStore((s) => s.currentRoomId);
  const rid = typeof roomIdRaw === "string" ? roomIdRaw.trim() : "";
  const queryClient = useQueryClient();
  const { isSuccess: schedulesHydrated } = useRoomSchedules(rid || null);

  const { selectedPlace, setSelectedPlace } = useSelectedPlace();
  const selectedNorm =
    selectedPlace?.googlePlaceId &&
    selectedPlace.googlePlaceId.trim().length > 0
      ? normalizeGooglePlaceResourceId(selectedPlace.googlePlaceId.trim())
      : null;

  const visibleByScheduleId = usePlanScheduleRouteVisibilityStore(
    (s) => s.visibleByScheduleId,
  );
  const visibilityOrder = usePlanScheduleRouteVisibilityStore(
    (s) => s.visibilityOrder,
  );
  const visibleScheduleIds = useMemo(
    () =>
      Object.keys(visibleByScheduleId)
        .map((k) => Number(k))
        .filter(
          (id) => Number.isFinite(id) && visibleByScheduleId[id] === true,
        ),
    [visibleByScheduleId],
  );

  const directionsEpoch = usePlanMapDirectionsEpochStore((s) =>
    rid.length > 0 ? (s.epochByRoomId[rid] ?? 0) : 0,
  );
  const epochBySegmentKey = usePlanMapDirectionsEpochStore(
    (s) => s.epochBySegmentKey,
  );
  const syncRouteRenderStatuses = usePlanMapDirectionsEpochStore(
    (s) => s.syncRouteRenderStatuses,
  );

  const orderedScheduleIdsForQueries = useMemo(
    () => [...visibleScheduleIds].sort((a, b) => a - b),
    [visibleScheduleIds],
  );

  const routeColorByScheduleId = useMemo(
    () =>
      scheduleIdsToRouteColors(
        sortedScheduleIdsForRouteColors(visibleByScheduleId),
        rid || undefined,
      ),
    [visibleByScheduleId, rid],
  );
  const fallbackRouteStroke = "#f12d33";

  const placesQueries = useQueries({
    queries: orderedScheduleIdsForQueries.map((scheduleId) => ({
      queryKey: scheduleItemsQueryKey(rid || null, scheduleId),
      queryFn: () => readSchedulePlanPlacesFromCache(queryClient, rid, scheduleId),
      enabled:
        rid.length > 0 &&
        orderedScheduleIdsForQueries.length > 0 &&
        schedulesHydrated,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })),
  });

  const buckets = orderedScheduleIdsForQueries.map(
    (_, idx) => placesQueries[idx]?.data ?? [],
  );
  const segments = flattenPlanItinerarySegmentsFromPlaces(
    orderedScheduleIdsForQueries,
    buckets,
  );

  const pathsPerSegmentQueries = useQueries({
    queries: segments.map((seg) => {
      const epochKey = planMapSegmentEpochStoreKey(
        rid,
        seg.scheduleId,
        seg.segmentSourceItemId,
      );
      const segmentEpoch = epochBySegmentKey[epochKey] ?? 0;

      return {
        queryKey: planItinerarySegmentMapPathQueryKey(
          rid,
          seg.scheduleId,
          seg.segmentSourceItemId,
          seg.originPlaceId,
          seg.destPlaceId,
          seg.travelModeCanon,
          directionsEpoch,
          segmentEpoch,
        ),
        queryFn: () => fetchOrientedPlanItinerarySegmentPath(seg),
        enabled: rid.length > 0 && segments.length > 0,
        staleTime: Infinity,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        retry: false,
      };
    }),
  });

  const routeRenderStatusEntries = useMemo(
    () =>
      segments.map((seg, index) => {
        const query = pathsPerSegmentQueries[index];
        const status =
          !query || query.isPending || query.isFetching
            ? "loading"
            : query.isError || !query.data?.length
              ? "unavailable"
              : "available";
        return {
          scheduleId: seg.scheduleId,
          segmentSourceItemId: seg.segmentSourceItemId,
          status,
        } as const;
      }),
    [segments, pathsPerSegmentQueries],
  );

  useEffect(() => {
    syncRouteRenderStatuses(rid, routeRenderStatusEntries);
  }, [rid, routeRenderStatusEntries, syncRouteRenderStatuses]);

  const polylines: Array<JSX.Element> = [];
  segments.forEach((seg, segIdx) => {
    const query = pathsPerSegmentQueries[segIdx];
    if (!query || query.isPending || query.isFetching) return;
    const pts = query.data ?? [];

    const segEpochKey = planMapSegmentEpochStoreKey(
      rid,
      seg.scheduleId,
      seg.segmentSourceItemId,
    );
    const segEpoch = epochBySegmentKey[segEpochKey] ?? 0;

    const routeColor =
      routeColorByScheduleId.get(seg.scheduleId) ?? fallbackRouteStroke;

    if (pts.length) {
      polylines.push(
        <Polyline
          key={`${seg.scheduleId}-${seg.segmentSourceItemId}-${seg.travelModeCanon}-${directionsEpoch}-${segEpoch}`}
          zIndex={40 + segIdx}
          strokeColor={routeColor}
          strokeOpacity={0.8}
          strokeWeight={8}
          path={pts}
          icons={buildPlanItineraryRouteArrowIcons(routeColor)}
        />,
      );
    }

    const connectorPaths = buildPlanItineraryRouteConnectorPaths({
      path: pts,
      origin: seg.originLocation,
      dest: seg.destLocation,
    });
    connectorPaths.forEach((connectorPath, connectorIdx) => {
      polylines.push(
        <Polyline
          key={`${seg.scheduleId}-${seg.segmentSourceItemId}-${seg.travelModeCanon}-${directionsEpoch}-${segEpoch}-connector-${connectorIdx}`}
          zIndex={35 + segIdx}
          strokeColor={routeColor}
          strokeOpacity={0}
          strokeWeight={8}
          path={connectorPath}
          icons={buildPlanItineraryRouteConnectorDotIcons(routeColor)}
        />,
      );
    });
  });

  const stopsForOffset = useMemo(() => {
    const out: PlanMapStopForOffset[] = [];
    orderedScheduleIdsForQueries.forEach((scheduleId, bucketIdx) => {
      const places = buckets[bucketIdx] ?? [];
      places.forEach((place, orderIndex) => {
        const loc = place.location;
        const gid =
          typeof place.googlePlaceId === "string"
            ? place.googlePlaceId.trim()
            : "";
        if (!loc || typeof place.itemId !== "number" || !gid.length) return;
        const legacyId = normalizeGooglePlaceResourceId(gid);
        if (selectedNorm != null && legacyId === selectedNorm) return;
        out.push({
          scheduleId,
          itemId: place.itemId,
          orderIndex,
          location: loc,
        });
      });
    });
    return out;
  }, [orderedScheduleIdsForQueries, buckets, selectedNorm]);

  const visibleStops = useMemo(
    () => filterVisiblePlanMapStops(stopsForOffset, visibilityOrder),
    [stopsForOffset, visibilityOrder],
  );

  const placeByScheduleAndItemId = useMemo(() => {
    const map = new Map<
      string,
      { place: (typeof buckets)[number][number]; scheduleId: number }
    >();
    orderedScheduleIdsForQueries.forEach((scheduleId, bucketIdx) => {
      const places = buckets[bucketIdx] ?? [];
      places.forEach((place) => {
        if (typeof place.itemId !== "number") return;
        map.set(`${scheduleId}-${place.itemId}`, { place, scheduleId });
      });
    });
    return map;
  }, [orderedScheduleIdsForQueries, buckets]);

  const stopMarkers: Array<JSX.Element> = [];
  for (const stop of visibleStops) {
    const entry = placeByScheduleAndItemId.get(
      `${stop.scheduleId}-${stop.itemId}`,
    );
    if (!entry) continue;
    const { place, scheduleId } = entry;
    const loc = place.location;
    const gid =
      typeof place.googlePlaceId === "string" ? place.googlePlaceId.trim() : "";
    if (!loc || !gid.length) continue;

    const legacyId = normalizeGooglePlaceResourceId(gid);
    const dayColor =
      routeColorByScheduleId.get(scheduleId) ?? fallbackRouteStroke;
    stopMarkers.push(
      <AdvancedMarker
        key={`plan-stop-${scheduleId}-${place.itemId}`}
        position={loc}
        title={place.title}
        onClick={(e) => {
          e.stop();
          setSelectedPlace(
            {
              name: place.title,
              category: "",
              rating: null,
              googlePlaceId: legacyId,
              location: loc,
              address: place.subtitle,
            },
            { analyticsSource: "plan", preserveMapZoom: true },
          );
        }}
      >
        <PlanItineraryStopMapPin
          orderLabel={stop.orderIndex + 1}
          pinColor={dayColor}
          className="cursor-pointer scale-90 select-none"
        />
      </AdvancedMarker>,
    );
  }

  return (
    <>
      {polylines}
      {stopMarkers}
    </>
  );
}
