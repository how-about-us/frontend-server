"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, Search, Send } from "lucide-react";
import { toast } from "sonner";

import { SearchResultCard } from "@/components/place";
import { SetSectionMaxWidth } from "@/contexts/SectionWidthContext";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { cappedPlacesSearchRadiusMeters } from "@/lib/maps";
import { useMapCenterStore } from "@/stores/map-center-store";
import { useSearchRecenterStore } from "@/stores/search-recenter-store";
import {
  usePlacesSearch,
  type PlaceSearchResult,
} from "@/hooks/usePlacesSearch";
import { PlacesSearchInput } from "@/components/search/PlacesSearchInput";
import { useChatActions } from "@/hooks/useChatActions";
import { useChat } from "@/hooks/useChat";
import {
  chatPlaceShareBannerGlowDurationSec,
  chatPlaceShareBannerSweepDurationSec,
} from "@/components/chat/chat-animations";
import { useSessionStore } from "@/stores/session-store";
import { useSearchMapPinsStore } from "@/stores/search-map-pins-store";

export default function SearchPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q")?.trim() ?? "";
  const isShareMode = searchParams.get("share") === "chat";
  const currentRoomId = useSessionStore((s) => s.currentRoomId);
  const hasRoom =
    typeof currentRoomId === "string" && currentRoomId.trim().length > 0;

  const { setSelectedPlace } = useSelectedPlace();
  const clearSearchMapPins = useSearchMapPinsStore((s) => s.clearSearchMapPins);
  const setSearchMapPinsFromResults = useSearchMapPinsStore(
    (s) => s.setSearchMapPinsFromResults,
  );
  const mapCenter = useMapCenterStore((s) => s.mapCenter);
  const recenterRequestId = useSearchRecenterStore((s) => s.recenterRequestId);
  const { sendPlaceMessage, canSend } = useChatActions();
  const { openChat } = useChat();

  const [query, setQuery] = useState("");
  /** 마지막 검색·재검색 시점의 지도 중심 — 드래그만으로는 바뀌지 않음 */
  const [searchCoords, setSearchCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  /** 뷰포트 반경(m)을 상한 적용한 값 — `GET /places/search` radius */
  const [searchRadius, setSearchRadius] = useState<number | undefined>(
    undefined,
  );

  const commitSearchAtCurrentView = useCallback(
    (trimmedQuery: string) => {
      const trimmed = trimmedQuery.trim();
      const { clearSearchSnapshot, setSearchSnapshot } =
        useSearchRecenterStore.getState();

      if (!trimmed.length) {
        clearSearchSnapshot();
        setSearchCoords(null);
        setSearchRadius(undefined);
        return;
      }

      clearSearchMapPins();
      const { mapCenter: c, zoom: z, radiusMeters: rm } =
        useMapCenterStore.getState();
      const radius = cappedPlacesSearchRadiusMeters(rm);

      if (!c) {
        clearSearchSnapshot();
        setSearchCoords(null);
        setSearchRadius(undefined);
        return;
      }

      setSearchSnapshot({
        center: { lat: c.lat, lng: c.lng },
        zoom: z,
        radius,
      });
      setSearchCoords({ lat: c.lat, lng: c.lng });
      setSearchRadius(radius);
    },
    [clearSearchMapPins],
  );

  useLayoutEffect(() => {
    if (!qParam) {
      setQuery("");
      commitSearchAtCurrentView("");
      return;
    }
    setQuery(qParam);
    commitSearchAtCurrentView(qParam);
  }, [qParam, commitSearchAtCurrentView]);

  /** 지도 준비 전 URL 진입(`?q=`) 시, 카메라 동기화 후 첫 검색 스냅샷 */
  useEffect(() => {
    if (!qParam) return;
    if (!mapCenter) return;
    if (searchCoords !== null) return;
    commitSearchAtCurrentView(qParam);
  }, [qParam, mapCenter, searchCoords, commitSearchAtCurrentView]);

  function handleSearch(q: string) {
    const trimmed = q.trim();
    setQuery(trimmed);
    commitSearchAtCurrentView(trimmed);

    const params = new URLSearchParams(searchParams.toString());
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");
    router.replace(`/search?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (recenterRequestId === 0) return;
    const trimmed = query.trim();
    if (!trimmed.length) return;
    commitSearchAtCurrentView(trimmed);
  }, [recenterRequestId, query, commitSearchAtCurrentView]);

  const {
    data: results,
    isLoading,
    isError,
    error,
  } = usePlacesSearch(
    query,
    searchCoords?.lat ?? null,
    searchCoords?.lng ?? null,
    searchCoords !== null ? searchRadius : undefined,
  );

  useEffect(() => {
    const hasActiveSearch =
      query.trim().length > 0 && searchCoords !== null;

    if (
      hasActiveSearch &&
      !isLoading &&
      !isError &&
      results &&
      results.length > 0
    ) {
      setSearchMapPinsFromResults(results);
    } else {
      clearSearchMapPins();
    }
  }, [
    query,
    searchCoords,
    searchRadius,
    isLoading,
    isError,
    results,
    setSearchMapPinsFromResults,
    clearSearchMapPins,
  ]);

  useEffect(
    () => () => {
      clearSearchMapPins();
      useSearchRecenterStore.getState().clearSearchSnapshot();
    },
    [clearSearchMapPins],
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
    setSelectedPlace(result, { preserveMapZoom: true });
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
          onClear={() => handleSearch("")}
        />
      </div>
      {shareModeActive ?
        <motion.div
          className="relative shrink-0 overflow-hidden border-b border-brand-red/40"
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={
            reduceMotion ?
              {
                opacity: 1,
                y: 0,
                backgroundColor: "rgba(241,45,51,0.09)",
              }
            : {
                opacity: 1,
                y: 0,
                backgroundColor: [
                  "rgba(241,45,51,0.055)",
                  "rgba(241,45,51,0.13)",
                  "rgba(241,45,51,0.055)",
                ],
                boxShadow: [
                  "inset 0 0 0 rgba(241,45,51,0)",
                  "inset 0 -18px 40px rgba(241,45,51,0.125)",
                  "inset 0 0 0 rgba(241,45,51,0)",
                ],
              }
          }
          transition={
            reduceMotion ?
              { duration: 0 }
            : {
                opacity: { type: "spring", stiffness: 420, damping: 32 },
                y: { type: "spring", stiffness: 420, damping: 32 },
                backgroundColor: {
                  repeat: Infinity,
                  duration: chatPlaceShareBannerGlowDurationSec,
                  ease: "easeInOut",
                },
                boxShadow: {
                  repeat: Infinity,
                  duration: chatPlaceShareBannerGlowDurationSec,
                  ease: "easeInOut",
                },
              }
          }
        >
          {!reduceMotion ?
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-[2] h-[11px] overflow-hidden bg-gradient-to-b from-brand-red/[0.38] via-brand-red/[0.12] to-transparent"
            >
              <motion.div
                className="absolute left-0 top-px h-[3px] w-[44%]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 5%, rgba(251,165,173,1) 38%, rgba(255,248,249,1) 48%, rgba(241,45,51,1) 52%, rgba(255,190,196,1) 60%, transparent 95%)",
                  boxShadow:
                    "0 0 18px rgba(241,45,51,1), 0 0 32px rgba(241,45,51,0.65), 0 0 48px rgba(255,96,109,0.45)",
                  filter: "blur(0.55px)",
                }}
                initial={false}
                animate={{ left: ["-48%", "135%"] }}
                transition={{
                  repeat: Infinity,
                  duration: chatPlaceShareBannerSweepDurationSec,
                  ease: "linear",
                }}
              />
            </div>
          : null}
          <div className="relative z-[3] flex min-h-[52px] shrink-0 items-center gap-2 px-4 py-3 text-[13px] font-semibold leading-snug tracking-tight text-brand-red drop-shadow-[0_0_10px_rgba(241,45,51,0.22)]">
            <motion.span
              className="inline-flex shrink-0 text-brand-red"
              aria-hidden
              animate={
                reduceMotion ?
                  {}
                : {
                    filter: [
                      "drop-shadow(0 0 2px rgba(241,45,51,0.25))",
                      "drop-shadow(0 0 7px rgba(241,45,51,0.55))",
                      "drop-shadow(0 0 2px rgba(241,45,51,0.25))",
                    ],
                  }
              }
              transition={{
                repeat: Infinity,
                duration: chatPlaceShareBannerGlowDurationSec,
                ease: "easeInOut",
              }}
            >
              <Send className="h-4 w-4" />
            </motion.span>
            <span className="min-w-0 flex-1">
              장소를 선택하면 채팅으로 전송됩니다.
            </span>
            <button
              type="button"
              onClick={() => router.replace("/search")}
              className="ml-auto shrink-0 rounded-md border border-brand-red/45 bg-white/92 px-2.5 py-1.5 text-[11px] font-medium text-dark-gray shadow-sm hover:bg-white"
            >
              취소
            </button>
          </div>
        </motion.div>
      : null}

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
