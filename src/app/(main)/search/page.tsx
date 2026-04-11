"use client";

import { PlaceAutocomplete } from "@/components/googleMap";
import { SearchResultCard } from "@/components/place";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { MOCK_SEARCH_RESULTS } from "@/mocks";

export default function SearchPage() {
  const { setSelectedPlace } = useSelectedPlace();

  return (
    <div className="flex h-full min-h-0 flex-col border-b border-gray-border">
      <SetSectionMaxWidth value="s1" />
      <div className="shrink-0 border-b border-gray-border px-6 pb-4">
        <PlaceAutocomplete />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {MOCK_SEARCH_RESULTS.map((result, i) => (
          <SearchResultCard
            key={i}
            {...result}
            onClick={() => setSelectedPlace(result)}
          />
        ))}
      </div>
    </div>
  );
}
