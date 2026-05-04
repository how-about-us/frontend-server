"use client";

import { Polyline } from "@vis.gl/react-google-maps";
import { useQueries } from "@tanstack/react-query";
import { useMemo, type JSX } from "react";

import {
  fetchScheduleItemsAsPlanPlaces,
} from "@/lib/plan/scheduleItemPlaces";
import type { PlanPlace } from "@/lib/plan/types";
import {
  canonicalScheduleTravelMode,
} from "@/lib/plan/scheduleTravelMode";
import { fetchPlanSegmentPathLatLng } from "@/lib/maps/planItineraryDirectionsPath";
import { scheduleItemsQueryKey } from "@/lib/queryKeys/scheduleItems";
import { usePlanItineraryExpandedStore } from "@/stores/plan-itinerary-expanded-store";
import { usePlanMapDirectionsEpochStore } from "@/stores/plan-map-directions-epoch-store";
import { useSessionStore } from "@/stores/session-store";

type SegmentDescriptor = {
  scheduleId: number;
  segmentSourceItemId: number;
  originPlaceId: string;
  destPlaceId: string;
  travelModeCanon: string;
};

function flattenSegmentsFromPlaces([
  expandedScheduleIds,
  placesBuckets,
]: [number[], PlanPlace[][]]): SegmentDescriptor[] {
  const segments: SegmentDescriptor[] = [];

  expandedScheduleIds.forEach((scheduleId, idx) => {
    const places = placesBuckets[idx];
    if (!places?.length) return;
    for (let i = 0; i < places.length - 1; i += 1) {
      const a = places[i]!;
      const b = places[i + 1]!;
      const o = typeof a.googlePlaceId === "string" ? a.googlePlaceId.trim() : "";
      const d = typeof b.googlePlaceId === "string" ? b.googlePlaceId.trim() : "";
      if (
        typeof a.itemId !== "number" ||
        !o.length ||
        !d.length
      ) {
        continue;
      }
      segments.push({
        scheduleId,
        segmentSourceItemId: a.itemId,
        originPlaceId: o,
        destPlaceId: d,
        travelModeCanon:
          canonicalScheduleTravelMode(a.travelMode) ?? "WALKING",
      });
    }
  });

  return segments;
}

/**
 * 플랜 일차(`PlanDaySection` 펼침)·현재 방이 있을 때만, 일정 순서 장소 간 경로(polyline).
 * 구간 장소 목록은 `schedule-items` 쿼리와 동기화되고, 브로드캐스트 기반 재요청은
 * `{@link usePlanMapDirectionsEpochStore}.bumpForDirections` 에 담긴 에폭(`SCHEDULE_ITEM_CREATED`·`SCHEDULE_ITEM_DELETED`)으로만 명시적으로 트리거합니다.
 */
export function PlanItineraryMapRoutes() {
  const roomIdRaw = useSessionStore((s) => s.currentRoomId);
  const rid = typeof roomIdRaw === "string" ? roomIdRaw.trim() : "";

  const expandedByScheduleId = usePlanItineraryExpandedStore(
    (s) => s.expandedByScheduleId,
  );
  const expandedScheduleIds = useMemo(
    () =>
      Object.keys(expandedByScheduleId)
        .map((k) => Number(k))
        .filter(
          (id) =>
            Number.isFinite(id) && expandedByScheduleId[id] === true,
        ),
    [expandedByScheduleId],
  );

  const directionsEpoch = usePlanMapDirectionsEpochStore((s) =>
    rid.length > 0 ? (s.epochByRoomId[rid] ?? 0) : 0,
  );

  const orderedScheduleIdsForQueries = useMemo(
    () => [...expandedScheduleIds].sort((a, b) => a - b),
    [expandedScheduleIds],
  );

  const placesQueries = useQueries({
    queries: orderedScheduleIdsForQueries.map((scheduleId) => ({
      queryKey: scheduleItemsQueryKey(rid || null, scheduleId),
      queryFn: () =>
        rid.length === 0
          ? Promise.resolve([])
          : fetchScheduleItemsAsPlanPlaces(rid, scheduleId),
      enabled: rid.length > 0 && orderedScheduleIdsForQueries.length > 0,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    })),
  });

  const buckets = orderedScheduleIdsForQueries.map(
    (_, idx) => placesQueries[idx]?.data ?? [],
  );
  const segments = flattenSegmentsFromPlaces([
    orderedScheduleIdsForQueries,
    buckets,
  ]);

  const pathsResults = useQueries({
    queries: segments.map((seg) => ({
      queryKey: [
        "plan-itinerary-map-path",
        rid,
        seg.scheduleId,
        seg.segmentSourceItemId,
        seg.originPlaceId,
        seg.destPlaceId,
        seg.travelModeCanon,
        directionsEpoch,
      ] as const,
      queryFn: () =>
        fetchPlanSegmentPathLatLng(
          seg.originPlaceId,
          seg.destPlaceId,
          seg.travelModeCanon,
        ),
      enabled: rid.length > 0 && segments.length > 0,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: false,
    })),
  });

  const polylines: Array<JSX.Element> = [];
  segments.forEach((seg, idx) => {
    const pts = pathsResults[idx]?.data;
    if (!pts?.length) return;

    polylines.push(
      <Polyline
        key={`${seg.scheduleId}-${seg.segmentSourceItemId}-${seg.originPlaceId}-${seg.destPlaceId}-${seg.travelModeCanon}-${directionsEpoch}`}
        strokeColor="#f12d33"
        strokeOpacity={0.92}
        strokeWeight={8}
        path={pts}
      />,
    );
  });

  return <>{polylines}</>;
}
