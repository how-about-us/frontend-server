/// <reference types="google.maps" />

import {
  cappedPlacesSearchRadiusMeters,
} from "@/lib/maps";
import { useMapCenterStore } from "@/stores/map-center-store";
import type {
  DiscoverMapSnapshot,
  SearchMapSnapshot,
} from "@/stores/search-recenter-store";

/** 검색 페이지 `GET /places/search` 의 위치 고정 스냅샷 (`map-center-store` 기준) */
export function buildSearchMapSnapshotFromMapCenterStore(): SearchMapSnapshot | null {
  const { mapCenter, zoom, radiusMeters } = useMapCenterStore.getState();
  if (!mapCenter) return null;
  return {
    center: mapCenter,
    zoom: zoom ?? null,
    radius: cappedPlacesSearchRadiusMeters(radiusMeters),
  };
}

/** Discover(Places JS) 영역 고정 스냅샷 — 맵 현재 카메라 기준 1회 커밋 */
export function buildDiscoverSnapshotFromGoogleMap(
  map: google.maps.Map,
  geometryLib: google.maps.GeometryLibrary,
): DiscoverMapSnapshot | null {
  const bounds = map.getBounds();
  if (!bounds) return null;

  const center = bounds.getCenter();
  const northEast = bounds.getNorthEast();
  const radiusRaw = geometryLib.spherical.computeDistanceBetween(
    center,
    northEast,
  );
  const radius =
    typeof radiusRaw === "number" && Number.isFinite(radiusRaw)
      ? Math.max(1, Math.round(radiusRaw))
      : 0;

  const zoomRaw = map.getZoom();
  const zoom = typeof zoomRaw === "number" ? zoomRaw : null;

  return {
    bounds: bounds.toJSON(),
    center: center.toJSON(),
    zoom,
    radius,
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
