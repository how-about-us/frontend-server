"use client";

import { shouldSuggestPlacesSearchRecenter } from "@/lib/maps";
import { useMapCenterStore } from "@/stores/map-center-store";
import type { DiscoverMapSnapshot } from "@/stores/search-recenter-store";
import { useSearchRecenterStore } from "@/stores/search-recenter-store";
import type { MapCenterCoords } from "@/stores/map-center-store";

type UsePlacesSearchHereVisibleParams = {
  discoverCategoryId: string | null;
};

function chipsDiscoverRecenterEligible(
  discoverCategoryId: string | null,
  discoverSnapshot: DiscoverMapSnapshot | null,
  mapCenter: MapCenterCoords,
  zoom: number | null,
): boolean {
  const chipChosen =
    typeof discoverCategoryId === "string"
    && discoverCategoryId.trim().length > 0;

  /** 칩 미선택이면 디스커버 재센터 없음 — 텍스트 검색은 별도 */
  if (!chipChosen || discoverSnapshot == null) return false;

  return shouldSuggestPlacesSearchRecenter({
    mapCenter,
    snapshotCenter: discoverSnapshot.center,
    snapshotRadiusMeters: discoverSnapshot.radius,
    zoom,
    snapshotZoom: discoverSnapshot.zoom,
  });
}

/**
 * 맵 하단 「이 위치 검색」 표시 여부:
 * - 텍스트 검색: `searchSnapshot`만 필요(칩과 무관)
 * - 카테고리 디스커버: 칩 선택 + 디스커버 스냅샷 + 카메라 이탈 시에만
 */
export function usePlacesSearchHereVisible({
  discoverCategoryId,
}: UsePlacesSearchHereVisibleParams): boolean {
  const mapCenter = useMapCenterStore((s) => s.mapCenter);
  const zoom = useMapCenterStore((s) => s.zoom);
  const searchSnapshot = useSearchRecenterStore((s) => s.searchSnapshot);
  const discoverSnapshot = useSearchRecenterStore((s) => s.discoverSnapshot);

  if (!mapCenter) return false;

  const suggestFromSearchSnapshot =
    searchSnapshot != null
    && shouldSuggestPlacesSearchRecenter({
      mapCenter,
      snapshotCenter: searchSnapshot.center,
      snapshotRadiusMeters: searchSnapshot.radius,
      zoom,
      snapshotZoom: searchSnapshot.zoom,
    });

  const suggestFromDiscoverChip = chipsDiscoverRecenterEligible(
    discoverCategoryId,
    discoverSnapshot,
    mapCenter,
    zoom,
  );

  return suggestFromSearchSnapshot || suggestFromDiscoverChip;
}
