"use client";

import { shouldSuggestPlacesSearchRecenter } from "@/lib/maps";
import { useMapCenterStore } from "@/stores/map-center-store";
import { useSearchRecenterStore } from "@/stores/search-recenter-store";

type UsePlacesSearchHereVisibleParams = {
  /** Discover 모드 카테고리 선택 시 문자열 ID, 미선택이면 null */
  discoverCategoryId: string | null;
};

/** 텍스트 검색 스냅샷 또는 Discover 스냅샷 중 하나라도 현재 카메라와 벌어지면 true */
export function usePlacesSearchHereVisible({
  discoverCategoryId,
}: UsePlacesSearchHereVisibleParams): boolean {
  const mapCenter = useMapCenterStore((s) => s.mapCenter);
  const zoom = useMapCenterStore((s) => s.zoom);
  const searchSnapshot = useSearchRecenterStore((s) => s.searchSnapshot);
  const discoverSnapshot = useSearchRecenterStore((s) => s.discoverSnapshot);

  if (!mapCenter) return false;

  const discoverActive =
    typeof discoverCategoryId === "string"
    && discoverCategoryId.trim().length > 0
    && discoverSnapshot != null;

  const suggestFromSearchSnapshot =
    searchSnapshot != null
    && shouldSuggestPlacesSearchRecenter({
      mapCenter,
      snapshotCenter: searchSnapshot.center,
      snapshotRadiusMeters: searchSnapshot.radius,
      zoom,
      snapshotZoom: searchSnapshot.zoom,
    });

  const suggestFromDiscover =
    discoverActive
    && discoverSnapshot != null
    && shouldSuggestPlacesSearchRecenter({
      mapCenter,
      snapshotCenter: discoverSnapshot.center,
      snapshotRadiusMeters: discoverSnapshot.radius,
      zoom,
      snapshotZoom: discoverSnapshot.zoom,
    });

  return suggestFromSearchSnapshot || suggestFromDiscover;
}
