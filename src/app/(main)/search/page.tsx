"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, AlertCircle } from "lucide-react";
import { SearchResultCard } from "@/components/place";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { usePlacesSearch } from "@/hooks/usePlacesSearch";

const DEFAULT_LOCATION = { lat: 37.5665, lng: 126.978 }; // Seoul fallback

function useGeolocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords(DEFAULT_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setCoords(DEFAULT_LOCATION);
        setLocationError(true);
      },
      { timeout: 5000 },
    );
  }, []);

  return { coords, locationError };
}

export default function SearchPage() {
  const { setSelectedPlace } = useSelectedPlace();
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { coords, locationError } = useGeolocation();

  const { data: results, isLoading, isError, error } = usePlacesSearch(
    query,
    coords?.lat ?? null,
    coords?.lng ?? null,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) setQuery(trimmed);
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-b border-gray-border">
      <SetSectionMaxWidth value="s1" />

      {/* Search input */}
      <div className="shrink-0 border-b border-gray-border px-4 pb-4 pt-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex flex-1 items-center">
            <Search className="absolute left-3 h-4 w-4 text-dark-gray pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="장소를 검색하세요"
              className="w-full rounded-lg border border-gray-border bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-[#99A1AF] focus:border-brand-green focus:ring-1 focus:ring-brand-green"
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || !coords}
            className="shrink-0 rounded-lg bg-brand-green px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            검색
          </button>
        </form>

        {locationError && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[#99A1AF]">
            <MapPin className="h-3 w-3" />
            위치 권한이 없어 기본 위치로 검색합니다.
          </p>
        )}
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
