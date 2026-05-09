"use client";

import { useLayoutEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Search, Send } from "lucide-react";
import { toast } from "sonner";

import { SearchResultCard } from "@/components/place";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useMapCenterStore } from "@/stores/map-center-store";
import {
  usePlacesSearch,
  type PlaceSearchResult,
} from "@/hooks/usePlacesSearch";
import { PlacesSearchInput } from "@/components/search/PlacesSearchInput";
import { useChatActions } from "@/hooks/useChatActions";
import { useChat } from "@/hooks/useChat";
import { useSessionStore } from "@/stores/session-store";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q")?.trim() ?? "";
  const isShareMode = searchParams.get("share") === "chat";
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const hasRoom =
    typeof currentRoomId === "string" && currentRoomId.trim().length > 0;

  const { setSelectedPlace } = useSelectedPlace();
  const mapCenter = useMapCenterStore((s) => s.mapCenter);
  const { sendPlaceMessage, canSend } = useChatActions();
  const { openChat } = useChat();

  const [query, setQuery] = useState("");
  // 검색 버튼을 누른 시점의 좌표만 사용 — 지도 이동으로 재요청되지 않음
  const [searchCoords, setSearchCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!qParam) {
      setQuery("");
      setSearchCoords(null);
      return;
    }
    setQuery(qParam);
    const { mapCenter: c } = useMapCenterStore.getState();
    setSearchCoords(c ? { lat: c.lat, lng: c.lng } : null);
  }, [qParam]);

  function handleSearch(q: string) {
    const trimmed = q.trim();
    setQuery(trimmed);
    const { mapCenter: c } = useMapCenterStore.getState();
    setSearchCoords(c ? { lat: c.lat, lng: c.lng } : null);

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  const {
    data: results,
    isLoading,
    isError,
    error,
  } = usePlacesSearch(
    query,
    searchCoords?.lat ?? null,
    searchCoords?.lng ?? null,
  );

  const shareModeActive = isShareMode && hasRoom;

  function handleCardClick(result: PlaceSearchResult) {
    if (shareModeActive) {
      if (!canSend) {
        toast.error("채팅 연결을 확인해주세요.");
        return;
      }
      sendPlaceMessage({
        googlePlaceId: result.googlePlaceId,
        name: result.name,
        formattedAddress: result.address ?? "",
        latitude: result.location.lat,
        longitude: result.location.lng,
        photoName: result.photoName,
        rating: result.rating ?? 0,
      });
      toast.success("장소를 채팅으로 보냈어요");
      router.replace("/search");
      openChat();
      return;
    }
    setSelectedPlace(result);
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-b border-gray-border">
      <SetSectionMaxWidth value="s1" />

      {/* 검색 입력 */}
      <div className="shrink-0 border-b border-gray-border pl-4 pr-3 pb-4">
        <PlacesSearchInput
          coords={mapCenter}
          urlQuery={qParam}
          onSearch={handleSearch}
        />
      </div>
      {shareModeActive && (
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-border bg-brand-green/10 px-4 py-2 text-[13px] text-brand-green">
          <Send className="h-3.5 w-3.5" />
          <span>장소를 선택하면 채팅으로 전송됩니다.</span>
          <button
            type="button"
            onClick={() => router.replace("/search")}
            className="ml-auto rounded-md bg-white/60 px-2 py-0.5 text-[11px] text-dark-gray hover:bg-white"
          >
            취소
          </button>
        </div>
      )}

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

        {results &&
          results.length > 0 &&
          results.map((result, i) => (
            <SearchResultCard
              key={result.googlePlaceId ?? i}
              {...result}
              onClick={() => handleCardClick(result)}
            />
          ))}
      </div>
    </div>
  );
}
