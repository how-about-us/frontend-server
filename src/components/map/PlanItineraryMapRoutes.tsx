"use client";

/// <reference types="google.maps" />

import { AdvancedMarker, Polyline } from "@vis.gl/react-google-maps";
import { useQueries } from "@tanstack/react-query";
import { useMemo, type JSX } from "react";

import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import {
  buildPlanItineraryRouteArrowIcons,
  fetchOrientedPlanItinerarySegmentPath,
  normalizeGooglePlaceResourceId,
} from "@/lib/maps";
import { fetchSchedulePlanPlacesFromCacheOrApi } from "@/lib/plan/scheduleItemPlaces";
import { scheduleIdsToRouteColors } from "@/lib/plan/planRouteDayColors";
import { displayPositionsForOverlappingStops } from "@/lib/plan/planItineraryMapMarkerOffset";
import {
  flattenPlanItinerarySegmentsFromPlaces,
} from "@/lib/plan/planItineraryMapSegments";
import {
  planItinerarySegmentMapPathQueryKey,
  scheduleItemsQueryKey,
} from "@/lib/query-keys";
import { usePlanItineraryExpandedStore } from "@/stores/plan-itinerary-expanded-store";
import {
  planMapSegmentEpochStoreKey,
  usePlanMapDirectionsEpochStore,
} from "@/stores/plan-map-directions-epoch-store";
import { useSessionStore } from "@/stores/session-store";

import { PlanItineraryStopMapPin } from "./PlanItineraryStopMapPin";

/**
 * 플랜 일차(`PlanDaySection` 펼침)·현재 방이 있을 때만,
 * 일정 순서 장소 간 경로(polyline)·정류장 마커를 표시합니다.
 * 폴리라인 travelMode는 항상 DRIVING(`planItineraryMapSegments`).
 * STOMP 에폭은 {@link usePlanMapDirectionsEpochStore} 참고.
 */
export function PlanItineraryMapRoutes() {
  const roomIdRaw = useSessionStore((s) => s.currentRoomId);
  const rid = typeof roomIdRaw === "string" ? roomIdRaw.trim() : "";

  const { selectedPlace, setSelectedPlace } = useSelectedPlace();
  const selectedNorm =
    selectedPlace?.googlePlaceId &&
    selectedPlace.googlePlaceId.trim().length > 0
      ? normalizeGooglePlaceResourceId(selectedPlace.googlePlaceId.trim())
      : null;

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

  const directionsEpoch = usePlanMapDirectionsEpochStore((s) =>
    rid.length > 0 ? (s.epochByRoomId[rid] ?? 0) : 0,
  );
  const epochBySegmentKey = usePlanMapDirectionsEpochStore(
    (s) => s.epochBySegmentKey,
  );

  const orderedScheduleIdsForQueries = useMemo(
    () => [...expandedScheduleIds].sort((a, b) => a - b),
    [expandedScheduleIds],
  );

  const routeColorByScheduleId = useMemo(
    () =>
      scheduleIdsToRouteColors(orderedScheduleIdsForQueries, rid || undefined),
    [orderedScheduleIdsForQueries, rid],
  );
  const fallbackRouteStroke = "#f12d33";

  const placesQueries = useQueries({
    queries: orderedScheduleIdsForQueries.map((scheduleId) => ({
      queryKey: scheduleItemsQueryKey(rid || null, scheduleId),
      queryFn: () =>
        rid.length === 0
          ? Promise.resolve([])
          : fetchSchedulePlanPlacesFromCacheOrApi(rid, scheduleId),
      enabled: rid.length > 0 && orderedScheduleIdsForQueries.length > 0,
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

  const polylines: Array<JSX.Element> = [];
  segments.forEach((seg, segIdx) => {
    const pts = pathsPerSegmentQueries[segIdx]?.data;
    if (!pts?.length) return;

    const segEpochKey = planMapSegmentEpochStoreKey(
      rid,
      seg.scheduleId,
      seg.segmentSourceItemId,
    );
    const segEpoch = epochBySegmentKey[segEpochKey] ?? 0;

    const routeColor =
      routeColorByScheduleId.get(seg.scheduleId) ?? fallbackRouteStroke;

    polylines.push(
      <Polyline
        key={`${seg.scheduleId}-${seg.segmentSourceItemId}-${directionsEpoch}-${segEpoch}`}
        zIndex={40 + segIdx}
        strokeColor={routeColor}
        strokeOpacity={0.8}
        strokeWeight={8}
        path={pts}
        icons={buildPlanItineraryRouteArrowIcons(routeColor)}
      />,
    );
  });

  const stopsForOffset = useMemo(() => {
    const out: Array<{
      scheduleId: number;
      itemId: number;
      location: google.maps.LatLngLiteral;
    }> = [];
    orderedScheduleIdsForQueries.forEach((scheduleId, bucketIdx) => {
      const places = buckets[bucketIdx] ?? [];
      places.forEach((place) => {
        const loc = place.location;
        const gid =
          typeof place.googlePlaceId === "string"
            ? place.googlePlaceId.trim()
            : "";
        if (!loc || typeof place.itemId !== "number" || !gid.length) return;
        const legacyId = normalizeGooglePlaceResourceId(gid);
        if (selectedNorm != null && legacyId === selectedNorm) return;
        out.push({ scheduleId, itemId: place.itemId, location: loc });
      });
    });
    return out;
  }, [orderedScheduleIdsForQueries, buckets, selectedNorm]);

  const displayPosByStopId = useMemo(
    () => displayPositionsForOverlappingStops(stopsForOffset),
    [stopsForOffset],
  );

  const stopMarkers: Array<JSX.Element> = [];
  orderedScheduleIdsForQueries.forEach((scheduleId, bucketIdx) => {
    const places = buckets[bucketIdx] ?? [];
    places.forEach((place, orderIdx) => {
      const loc = place.location;
      const gid =
        typeof place.googlePlaceId === "string"
          ? place.googlePlaceId.trim()
          : "";
      if (!loc || typeof place.itemId !== "number" || !gid.length) return;

      const legacyId = normalizeGooglePlaceResourceId(gid);
      if (selectedNorm != null && legacyId === selectedNorm) return;

      const dayColor =
        routeColorByScheduleId.get(scheduleId) ?? fallbackRouteStroke;

      const stopKey = `${scheduleId}-${place.itemId}`;
      const markerPos =
        displayPosByStopId.get(stopKey) ?? loc;

      stopMarkers.push(
        <AdvancedMarker
          key={`plan-stop-${scheduleId}-${place.itemId}`}
          position={markerPos}
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
              { preserveMapZoom: true },
            );
          }}
        >
          <PlanItineraryStopMapPin
            orderLabel={orderIdx + 1}
            pinColor={dayColor}
            className="cursor-pointer scale-90 select-none"
          />
        </AdvancedMarker>,
      );
    });
  });

  return (
    <>
      {polylines}
      {stopMarkers}
    </>
  );
}
