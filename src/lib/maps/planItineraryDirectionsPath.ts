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
