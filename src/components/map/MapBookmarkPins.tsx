"use client";

import { Bookmark } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { AdvancedMarker } from "@vis.gl/react-google-maps";

import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useAllRoomBookmarks, useBookmarkCategories } from "@/hooks/useRooms";
import { normalizeGooglePlaceResourceId } from "@/lib/maps";
import type { PlacePreview } from "@/lib/api/places";
import { fetchAndSeedPlacePreviews } from "@/lib/places/place-batch-cache";
import { seededPlacePreviewQueryOptions } from "@/lib/places/place-queries";
import { getQueryClient } from "@/lib/query-client";

import {
  MAP_PIN_BORDER_STROKE,
  MAP_PIN_BORDER_STROKE_WIDTH,
  MAP_PIN_DISPLAY_SIZE_PX,
} from "./map-pin-stroke";

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

  const {
    data: allBookmarks,
    isSuccess: bookmarksReady,
    isError: bookmarksError,
  } = useAllRoomBookmarks(roomId, { enabled: !!roomId });

  const categoryList = categories ?? [];
  const categoryColorById = useMemo(() => {
    const map = new Map<number, string>();
    for (const cat of categoryList) {
      map.set(cat.categoryId, cat.colorCode?.trim() || "#16a34a");
    }
    return map;
  }, [categoryList]);

  const listsSettled =
    categoriesReady && (bookmarksReady || bookmarksError || categoryList.length === 0);

  const flattenedBookmarks = useMemo((): BookmarkRowAugmented[] => {
    if (!listsSettled || !Array.isArray(allBookmarks)) return [];
    const out: BookmarkRowAugmented[] = [];
    for (const b of allBookmarks) {
      const gid =
        typeof b.googlePlaceId === "string" ? b.googlePlaceId.trim() : "";
      if (!gid.length) continue;
      const colorCode =
        categoryColorById.get(b.categoryId) ?? "#16a34a";
      out.push({
        bookmarkId: b.bookmarkId,
        googlePlaceId: gid,
        colorCode,
      });
    }
    return out;
  }, [allBookmarks, categoryColorById, listsSettled]);

  const uniquePlaceIds = useMemo(
    () => [...new Set(flattenedBookmarks.map((row) => row.googlePlaceId))],
    [flattenedBookmarks],
  );

  const [previewsSeeded, setPreviewsSeeded] = useState(false);

  useEffect(() => {
    if (!roomId || uniquePlaceIds.length === 0) {
      setPreviewsSeeded(true);
      return;
    }

    let cancelled = false;
    setPreviewsSeeded(false);
    void fetchAndSeedPlacePreviews(uniquePlaceIds, getQueryClient()).then(() => {
      if (!cancelled) setPreviewsSeeded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [roomId, uniquePlaceIds]);

  const placeQueryDefs = useMemo(() => {
    if (!roomId || !listsSettled || flattenedBookmarks.length === 0) {
      return [];
    }
    return flattenedBookmarks.map((row) =>
      seededPlacePreviewQueryOptions(row.googlePlaceId, {
        enabled: previewsSeeded,
      }),
    );
  }, [roomId, listsSettled, flattenedBookmarks, previewsSeeded]);

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
              className="flex items-center justify-center drop-shadow-md"
              style={{
                color: row.colorCode,
                width: MAP_PIN_DISPLAY_SIZE_PX,
                height: MAP_PIN_DISPLAY_SIZE_PX,
              }}
            >
              <Bookmark
                style={{
                  width: MAP_PIN_DISPLAY_SIZE_PX,
                  height: MAP_PIN_DISPLAY_SIZE_PX,
                }}
                fill="currentColor"
                stroke={MAP_PIN_BORDER_STROKE}
                strokeWidth={MAP_PIN_BORDER_STROKE_WIDTH}
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
