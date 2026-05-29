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
  const requestSearchRecenter = useSearchRecenterStore(
    (s) => s.requestSearchRecenter,
  );
  const requestDiscoverRecenter = useSearchRecenterStore(
    (s) => s.requestDiscoverRecenter,
  );
  const { visible, suggestSearchRecenter, suggestDiscoverRecenter } =
    usePlacesSearchHereVisible({ discoverCategoryId });

  return (
    <SearchHereFloatingButton
      visible={visible}
      onPress={() => {
        if (suggestSearchRecenter) {
          requestSearchRecenter();
          return;
        }
        if (suggestDiscoverRecenter) {
          requestDiscoverRecenter();
        }
      }}
    />
  );
}
