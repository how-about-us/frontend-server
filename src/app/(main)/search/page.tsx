"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";

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
  // 검색 버튼을 누른 시점의 좌표만 사용 — 지도 이동으로 재요청되지 않음
  const [searchCoords, setSearchCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  function handleSearch(q: string) {
    setQuery(q);
    setSearchCoords({ lat: mapCenter.lat, lng: mapCenter.lng });
  }

  const { data: results, isLoading, isError, error } = usePlacesSearch(
    query,
    searchCoords?.lat ?? null,
    searchCoords?.lng ?? null,
  );

  return (
    <div className="flex h-full min-h-0 flex-col border-b border-gray-border">
      <SetSectionMaxWidth value="s1" />

      {/* 검색 입력 */}
      <div className="shrink-0 border-b border-gray-border px-4 pb-4 pt-3">
        <PlacesSearchInput coords={mapCenter} onSearch={handleSearch} />
      </div>

      {/* 결과 */}
      <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-color:rgba(0,0,0,0.2)_transparent]">
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-dark-gray">
            <Loader2 className="h-6 w-6 animate-spin text-brand-green" />
            <span className="text-sm">장소를 검색하는 중...</span>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-[#FF6467]">
            <AlertCircle className="h-6 w-6" />
            <span className="text-sm">
              {error instanceof Error ? error.message : "검색에 실패했습니다."}
            </span>
          </div>
        )}

        {!isLoading && !isError && query && results?.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1 py-16 text-dark-gray">
            <Search className="h-6 w-6 text-[#99A1AF]" />
            <span className="text-sm">검색 결과가 없습니다.</span>
          </div>
        )}

        {!isLoading && !isError && !query && (
          <div className="flex flex-col items-center justify-center gap-1 py-16 text-[#99A1AF]">
            <Search className="h-8 w-8" />
            <span className="text-sm">검색어를 입력해 주세요.</span>
          </div>
        )}

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
