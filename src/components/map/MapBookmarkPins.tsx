"use client";

import { Bookmark } from "lucide-react";
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { AdvancedMarker } from "@vis.gl/react-google-maps";

import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useBookmarkCategories } from "@/hooks/useRooms";
import { getRoomBookmarks } from "@/lib/api/rooms/bookmarks";
import { normalizeGooglePlaceResourceId } from "@/lib/maps";
import type { PlacePreview } from "@/lib/api/places";
import {
  loadPlacePreview,
  placePreviewQueryDefaults,
  placePreviewQueryKey,
} from "@/lib/places/place-queries";
import { roomBookmarksQueryKey } from "@/lib/query-keys";

/** 맵 북마크 마커 아이콘 테두리 */
const BOOKMARK_MAP_MARKER_STROKE = "#000000";

export type MapBookmarkPinsProps = {
  roomId: string | null;
  /** true일 때만 핀을 그립니다. 데이터는 `roomId` 기준으로 캐시에 유지되며 토글과 무관합니다. */
  enabled: boolean;
  /** 일정 경로 장소와 동일한 장소 — plan 맵에서 북마크 핀을 숨깁니다. */
  hiddenNormalizedPlaceIds?: ReadonlySet<string>;
};

type BookmarkRowAugmented = {
  bookmarkId: number;
  googlePlaceId: string;
  colorCode: string;
};

function previewToSelectedPlacePayload(preview: PlacePreview) {
  return {
    name: preview.name,
    category: "",
    rating: null,
    googlePlaceId: preview.googlePlaceId,
    location: preview.location,
    address: preview.formattedAddress,
  };
}

export function MapBookmarkPins({
  roomId,
  enabled,
  hiddenNormalizedPlaceIds,
}: MapBookmarkPinsProps) {
  const { selectedPlace, setSelectedPlace } = useSelectedPlace();

  const { data: categories, isSuccess: categoriesReady } =
    useBookmarkCategories(roomId, { enabled: !!roomId });

  const categoryList = categories ?? [];

  const bookmarkListQueries = useQueries({
    queries: categoryList.map((cat) => ({
      queryKey: roomBookmarksQueryKey(roomId, cat.categoryId),
      queryFn: () => getRoomBookmarks(roomId!, cat.categoryId),
      enabled: !!roomId && categoriesReady,
      staleTime: 0,
    })),
  });

  const listsSettled = useMemo(() => {
    if (!categoriesReady) return false;
    if (categoryList.length === 0) return true;
    if (bookmarkListQueries.length !== categoryList.length) return false;
    return bookmarkListQueries.every((q) => q.isSuccess || q.isError);
  }, [categoriesReady, categoryList.length, bookmarkListQueries]);

  const flattenedBookmarks = useMemo((): BookmarkRowAugmented[] => {
    if (!listsSettled || !categoryList.length) return [];
    const out: BookmarkRowAugmented[] = [];
    categoryList.forEach((cat, i) => {
      const rows = bookmarkListQueries[i]?.data;
      if (!Array.isArray(rows) || !rows.length) return;
      const colorCode = cat.colorCode?.trim() || "#16a34a";
      for (const b of rows) {
        const gid =
          typeof b.googlePlaceId === "string" ? b.googlePlaceId.trim() : "";
        if (!gid.length) continue;
        out.push({
          bookmarkId: b.bookmarkId,
          googlePlaceId: gid,
          colorCode,
        });
      }
    });
    return out;
  }, [categoryList, bookmarkListQueries, listsSettled]);

  const placeQueryDefs = useMemo(() => {
    if (!roomId || !listsSettled || flattenedBookmarks.length === 0) {
      return [];
    }
    return flattenedBookmarks.map((row) => ({
      queryKey: placePreviewQueryKey(row.googlePlaceId),
      queryFn: () => loadPlacePreview(row.googlePlaceId),
      staleTime: placePreviewQueryDefaults.staleTime,
      retry: 1,
    }));
  }, [roomId, listsSettled, flattenedBookmarks]);

  const placeQueries = useQueries({ queries: placeQueryDefs });

  const selectedNormalized = selectedPlace?.googlePlaceId
    ? normalizeGooglePlaceResourceId(selectedPlace.googlePlaceId)
    : null;

  if (!enabled) {
    return null;
  }

  return (
    <>
      {flattenedBookmarks.map((row, i) => {
        const preview = placeQueries[i]?.data;
        const loc = preview?.location;
        if (!preview || loc == null) return null;

        const legacyId = normalizeGooglePlaceResourceId(preview.googlePlaceId);
        if (selectedNormalized && legacyId === selectedNormalized) {
          return null;
        }
        if (hiddenNormalizedPlaceIds?.has(legacyId)) {
          return null;
        }

        return (
          <AdvancedMarker
            key={`${row.bookmarkId}-${legacyId}`}
            position={loc}
            title={preview.name}
            onClick={(e) => {
              e.stop();
              setSelectedPlace(
                {
                  ...previewToSelectedPlacePayload(preview),
                  fromBookmark: true,
                  bookmarkCategoryColor: row.colorCode,
                },
                { preserveMapZoom: true },
              );
            }}
          >
            <span
              className="flex h-[42px] w-[42px] items-center justify-center drop-shadow-md"
              style={{ color: row.colorCode }}
            >
              <Bookmark
                className="h-9 w-9"
                fill="currentColor"
                stroke={BOOKMARK_MAP_MARKER_STROKE}
                strokeWidth={2.5}
                strokeLinejoin="round"
                aria-hidden
              />
            </span>
          </AdvancedMarker>
        );
      })}
    </>
  );
}
