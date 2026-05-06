/// <reference types="google.maps" />

import { canonicalScheduleTravelMode } from "@/lib/plan/scheduleTravelMode";

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
        if (status !== google.maps.DirectionsStatus.OK || !result?.routes[0]) {
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
