"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { AdvancedMarker } from "@vis.gl/react-google-maps";

import { MapPinIcon } from "@/components/icons";
import { useSelectedPlace } from "@/contexts/SelectedPlaceContext";
import { useBookmarkCategories } from "@/hooks/useRooms";
import { getPlaceDetail } from "@/lib/api/places";
import { getRoomBookmarks } from "@/lib/api/rooms/bookmarks";
import { normalizeGooglePlaceResourceId } from "@/lib/maps";
import {
  bookmarkMapPinPlaceQueryKey,
  roomBookmarksQueryKey,
} from "@/lib/query-keys";

export type MapBookmarkPinsProps = {
  roomId: string | null;
  /** true일 때만 핀을 그립니다. 데이터는 `roomId` 기준으로 캐시에 유지되며 토글과 무관합니다. */
  enabled: boolean;
};

type BookmarkRowAugmented = {
  bookmarkId: number;
  googlePlaceId: string;
  colorCode: string;
};

function detailToSelectedPlacePayload(
  d: Awaited<ReturnType<typeof getPlaceDetail>>,
) {
  return {
    name: d.name,
    category: d.primaryTypeDisplayName || d.primaryType,
    rating: d.rating,
    googlePlaceId: d.googlePlaceId,
    location: d.location,
    address: d.formattedAddress,
    userRatingCount: d.userRatingCount,
    reviewSummary: d.reviewSummary,
    isOpen: d.regularOpeningHours?.openNow ?? null,
    phone: d.phoneNumber || undefined,
    website: d.websiteUri || undefined,
    hours: d.regularOpeningHours?.weekdayDescriptions?.length
      ? d.regularOpeningHours.weekdayDescriptions.join("\n")
      : undefined,
  };
}

export function MapBookmarkPins({ roomId, enabled }: MapBookmarkPinsProps) {
  const { selectedPlace, setSelectedPlace } = useSelectedPlace();

  const { data: categories, isSuccess: categoriesReady } = useBookmarkCategories(
    roomId,
    { enabled: !!roomId },
  );

  const categoryList = categories ?? [];

  const bookmarkListQueries = useQueries({
    queries: categoryList.map((cat) => ({
      queryKey: roomBookmarksQueryKey(roomId, cat.categoryId),
      queryFn: () => getRoomBookmarks(roomId!, cat.categoryId),
      enabled: !!roomId && categoriesReady,
      staleTime: 60_000,
    })),
  });

  const flattenedBookmarks = useMemo((): BookmarkRowAugmented[] => {
    if (!categoryList.length) return [];
    const out: BookmarkRowAugmented[] = [];
    categoryList.forEach((cat, i) => {
      const rows = bookmarkListQueries[i]?.data;
      if (!rows?.length) return;
      const colorCode = cat.colorCode?.trim() || "#16a34a";
      for (const b of rows) {
        const gid = typeof b.googlePlaceId === "string" ? b.googlePlaceId.trim() : "";
        if (!gid.length) continue;
        out.push({
          bookmarkId: b.bookmarkId,
          googlePlaceId: gid,
          colorCode,
        });
      }
    });
    return out;
  }, [categoryList, bookmarkListQueries]);

  const listsLoaded = bookmarkListQueries.every((q) => !q.isPending);

  const placeQueries = useQueries({
    queries: flattenedBookmarks.map((row) => ({
      queryKey: bookmarkMapPinPlaceQueryKey(roomId!, row.bookmarkId),
      queryFn: () => getPlaceDetail(row.googlePlaceId),
      enabled:
        !!roomId &&
        listsLoaded &&
        flattenedBookmarks.length > 0,
      staleTime: 60_000,
    })),
  });

  const selectedNormalized = selectedPlace?.googlePlaceId
    ? normalizeGooglePlaceResourceId(selectedPlace.googlePlaceId)
    : null;

  if (!enabled) {
    return null;
  }

  return (
    <>
      {flattenedBookmarks.map((row, i) => {
        const detail = placeQueries[i]?.data;
        const loc = detail?.location;
        if (!detail || loc == null) return null;

        const legacyId = normalizeGooglePlaceResourceId(detail.googlePlaceId);
        if (selectedNormalized && legacyId === selectedNormalized) {
          return null;
        }

        return (
          <AdvancedMarker
            key={`${row.bookmarkId}-${legacyId}`}
            position={loc}
            title={detail.name}
            onClick={(e) => {
              e.stop();
              setSelectedPlace(
                {
                  ...detailToSelectedPlacePayload(detail),
                  fromBookmark: true,
                  bookmarkCategoryColor: row.colorCode,
                },
                { skipMapRecenter: true },
              );
            }}
          >
            <span
              className="block scale-95 drop-shadow-md"
              style={{ color: row.colorCode }}
            >
              <MapPinIcon size={34} />
            </span>
          </AdvancedMarker>
        );
      })}
    </>
  );
}
