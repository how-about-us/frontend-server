"use client";

import { SearchHereFloatingButton } from "@/components/map/SearchHereFloatingButton";
import { usePlacesSearchHereVisible } from "@/components/map/usePlacesSearchHereVisible";
import { useSearchRecenterStore } from "@/stores/search-recenter-store";

export type MapSearchHereButtonProps = {
  discoverCategoryId: string | null;
};

export function MapSearchHereButton({
  discoverCategoryId,
}: MapSearchHereButtonProps) {
  const requestRecenter = useSearchRecenterStore((s) => s.requestRecenter);
  const visible = usePlacesSearchHereVisible({ discoverCategoryId });

  return (
    <SearchHereFloatingButton
      visible={visible}
      onPress={() => requestRecenter()}
    />
  );
}
