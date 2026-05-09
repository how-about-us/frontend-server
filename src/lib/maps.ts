/// <reference types="google.maps" />

import type { QueryClient } from "@tanstack/react-query";

import {
  flattenPlanItinerarySegmentsFromPlaces,
  planItinerarySegmentPathRecordKey,
} from "@/lib/plan/planItineraryMapSegments";
import { fetchScheduleItemsAsPlanPlaces } from "@/lib/plan/scheduleItemPlaces";
import { canonicalScheduleTravelMode } from "@/lib/plan/scheduleTravelMode";
import { scheduleItemsQueryKey } from "@/lib/query-keys";

const STORAGE_KEY = "hau:destination-center-v1";

type Payload = Record<
  string,
  { lat: number; lng: number; destination: string }
>;

function loadAll(): Payload {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Payload;
  } catch {
    return {};
  }
}

function saveAll(payload: Payload): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / privacy mode */
  }
}

function destinationCacheKey(roomId: string): string {
  return roomId.trim();
}

/** 방 + 목적지 문자열 단위로 한 번 찍은 지오코드를 세션 동안 재사용 (새로고침 깜빡임 완화) */
export function readDestinationLatLngFromSession(
  roomId: string,
  destination: string,
): google.maps.LatLngLiteral | null {
  const rid = destinationCacheKey(roomId);
  const d = destination.trim();
  if (!rid.length || !d.length) return null;
  const entry = loadAll()[rid];
  if (!entry || entry.destination !== d) return null;
  const { lat, lng } = entry;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function writeDestinationLatLngToSession(
  roomId: string,
  destination: string,
  coords: google.maps.LatLngLiteral,
): void {
  const rid = destinationCacheKey(roomId);
  const d = destination.trim();
  if (!rid.length || !d.length) return;
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return;
  const all = loadAll();
  all[rid] = { lat: coords.lat, lng: coords.lng, destination: d };
  saveAll(all);
}

/** Google Places 리소스 id(`places/…`) 접두를 제거한 레거시 id */
export function normalizeGooglePlaceResourceId(id: string): string {
  const prefix = "places/";
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

function toGmTravelMode(
  modeRaw: string | undefined,
): google.maps.TravelMode {
  const c = canonicalScheduleTravelMode(modeRaw) ?? "WALKING";
  const T = google.maps.TravelMode;
  switch (c) {
    case "WALKING":
      return T.WALKING;
    case "DRIVING":
      return T.DRIVING;
    case "BICYCLING":
      return T.BICYCLING;
    case "TRANSIT":
      return T.TRANSIT;
    default:
      return T.WALKING;
  }
}

/**
 * Directions `overview_path` 가 출발/도착과 반대일 때 뒤집습니다.
 * 폴리라인·화살표가 일정 순서(작은 번호 → 큰 번호) 방향을 가리키게 합니다.
 */
export function orientPathSmallerStopToLarger(
  pts: google.maps.LatLngLiteral[],
  origin: google.maps.LatLngLiteral,
  dest: google.maps.LatLngLiteral,
): google.maps.LatLngLiteral[] {
  if (pts.length < 2) return pts;
  const d2 = (p: google.maps.LatLngLiteral, q: google.maps.LatLngLiteral) => {
    const dx = p.lat - q.lat;
    const dy = p.lng - q.lng;
    return dx * dx + dy * dy;
  };
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  const forwardFit = d2(first, origin) + d2(last, dest);
  const backwardFit = d2(first, dest) + d2(last, origin);
  if (backwardFit < forwardFit) {
    return [...pts].reverse();
  }
  return pts;
}

/**
 * 일정 두 장소(Place ID) 구간 경로 좌표 — Maps JS DirectionsService.
 */
export async function fetchPlanSegmentPathLatLng(
  originPlaceId: string,
  destPlaceId: string,
  segmentTravelMode: string | undefined,
): Promise<google.maps.LatLngLiteral[]> {
  await google.maps.importLibrary("routes");
  const svc = new google.maps.DirectionsService();

  const o = originPlaceId.trim();
  const d = destPlaceId.trim();
  if (!o.length || !d.length) return [];

  const travelMode = toGmTravelMode(segmentTravelMode);

  return await new Promise((resolve) => {
    svc.route(
      {
        origin: { placeId: o },
        destination: { placeId: d },
        travelMode,
      },
      (result, status) => {
        if (
          status !== google.maps.DirectionsStatus.OK ||
          !result?.routes[0]
        ) {
          resolve([]);
          return;
        }
        const pts = result.routes[0]?.overview_path;
        if (!pts?.length) {
          resolve([]);
          return;
        }
        resolve(
          pts.map((p) => ({ lat: p.lat(), lng: p.lng() })),
        );
      },
    );
  });
}

/**
 * 라인색에 맞춰 폴리라인 화살표 테두리를 어둡게 한다.
 */
function mixRgbTowardsBlack(hex: string, blend: number): string {
  const h = hex.replace(/^#/, "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#591016";
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  const t = Math.max(0, Math.min(1, blend));
  return `#${[r, g, b]
    .map((c) =>
      Math.round(c * (1 - t)).toString(16).padStart(2, "0"),
    )
    .join("")}`;
}

/**
 * 폴리라인·일차 라인색에 맞춘 화살표 아이콘 시퀀스 (`SymbolPath.BACKWARD_CLOSED_ARROW` = path 1).
 */
export function buildPlanItineraryRouteArrowIcons(
  routeStrokeHex: string,
): google.maps.IconSequence[] {
  const strokeDark = mixRgbTowardsBlack(routeStrokeHex.trim(), 0.22);
  return [
    {
      icon: {
        path: 1 satisfies google.maps.SymbolPath,
        fillColor: "#ffffff",
        fillOpacity: 0.96,
        strokeColor: strokeDark,
        strokeOpacity: 0.95,
        strokeWeight: 1.5,
        scale: 3,
      },
      repeat: "70px",
    },
  ];
}

/**
 * 레거시 기본 라인색용; 신규는 {@link buildPlanItineraryRouteArrowIcons}.
 */
export const PLAN_ITINERARY_ROUTE_ARROW_ICONS: google.maps.IconSequence[] =
  buildPlanItineraryRouteArrowIcons("#f12d33");

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
