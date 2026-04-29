"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { SearchResultCard } from "@/components/place";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useMapCenter } from "@/contexts/MapCenterContext";
import { usePlacesSearch } from "@/hooks/usePlacesSearch";
import { PlacesSearchInput } from "@/components/search/PlacesSearchInput";

export default function SearchPage() {
  const { setSelectedPlace } = useSelectedPlace();
  const { mapCenter } = useMapCenter();
  const [query, setQuery] = useState("");

  const { data: results, isLoading, isError, error } = usePlacesSearch(
    query,
    mapCenter.lat,
    mapCenter.lng,
  );

  return (
    <div className="flex h-full min-h-0 flex-col border-b border-gray-border">
      <SetSectionMaxWidth value="s1" />

      {/* Search input */}
      <div className="shrink-0 border-b border-gray-border px-4 pb-4 pt-3">
        <PlacesSearchInput coords={mapCenter} onSearch={setQuery} />
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(0,0,0,0.2)_transparent]">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-dark-gray">
            <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
            <span className="text-sm">장소를 검색하는 중...</span>
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-[#FF6467]">
            <AlertCircle className="h-6 w-6" />
            <span className="text-sm">
              {error instanceof Error ? error.message : "검색에 실패했습니다."}
            </span>
          </div>
        )}

        {/* Empty results */}
        {!isLoading && !isError && query && results?.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1 py-16 text-dark-gray">
            <Search className="h-6 w-6 text-[#99A1AF]" />
            <span className="text-sm">검색 결과가 없습니다.</span>
          </div>
        )}

        {/* Initial empty state */}
        {!isLoading && !isError && !query && (
          <div className="flex flex-col items-center justify-center gap-1 py-16 text-[#99A1AF]">
            <Search className="h-8 w-8" />
            <span className="text-sm">검색어를 입력해 주세요.</span>
          </div>
        )}

        {/* Results list */}
        {results && results.length > 0 &&
          results.map((result, i) => (
            <SearchResultCard
              key={result.googlePlaceId ?? i}
              {...result}
              onClick={() => setSelectedPlace(result)}
            />
          ))}
      </div>
    </div>
  );
}
