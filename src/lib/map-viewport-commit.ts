/// <reference types="google.maps" />

import { clampPlacesSearchRadiusMeters } from "@/lib/places/placesSearchRadius";
import { viewportSearchRadiusMetersFromBounds } from "@/lib/maps";
import { useMapCenterStore } from "@/stores/map-center-store";
import type {
  DiscoverMapSnapshot,
  SearchMapSnapshot,
} from "@/stores/search-recenter-store";

/** 검색 페이지 `GET /places/search` 의 위치 고정 스냅샷 (`map-center-store` 기준) */
export function buildSearchMapSnapshotFromMapCenterStore(): SearchMapSnapshot | null {
  const { mapCenter, zoom, radiusMeters } = useMapCenterStore.getState();
  if (!mapCenter) return null;
  const radius =
    radiusMeters != null && Number.isFinite(radiusMeters)
      ? clampPlacesSearchRadiusMeters(radiusMeters)
      : undefined;

  return {
    center: mapCenter,
    zoom: zoom ?? null,
    radius: radius ?? clampPlacesSearchRadiusMeters(5000),
  };
}

/** Discover(Places JS) 영역 고정 스냅샷 — 맵 현재 카메라 기준 1회 커밋 */
export function buildDiscoverSnapshotFromGoogleMap(
  map: google.maps.Map,
): DiscoverMapSnapshot | null {
  const bounds = map.getBounds();
  if (!bounds) return null;

  const boundsLiteral = bounds.toJSON();
  const center = bounds.getCenter().toJSON();
  const radius = viewportSearchRadiusMetersFromBounds(center, boundsLiteral);

  const zoomRaw = map.getZoom();
  const zoom = typeof zoomRaw === "number" ? zoomRaw : null;

  return {
    bounds: boundsLiteral,
    center,
    zoom,
    radius: clampPlacesSearchRadiusMeters(radius),
  };
}

/** Discover 스냅샷의 bounds로 Places 결과 좌표 클라이언트 필터 포함 여부 검사용 */
export function boundsInstanceFromDiscoverSnapshot(
  b: google.maps.LatLngBoundsLiteral,
): google.maps.LatLngBounds {
  return new google.maps.LatLngBounds(
    { lat: b.south, lng: b.west },
    { lat: b.north, lng: b.east },
  );
}
