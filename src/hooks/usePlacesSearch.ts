"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  searchPlaces,
  type PlaceSearchItem,
} from "@/lib/api/places";
import { fetchPlacePhotoUrl } from "@/lib/places/place-queries";
import type { SearchResultCardProps } from "@/types/place";

export type PlaceSearchResult = SearchResultCardProps & {
  googlePlaceId: string;
  location: { lat: number; lng: number };
  /** 채팅으로 공유 시 STOMP payload 에 그대로 전달되는 원본 photoName */
  photoName: string;
};

export type PlaceSearchPage = {
  items: PlaceSearchResult[];
  nextPageToken: string | null;
};

function mapPlaceSearchItem(
  item: PlaceSearchItem,
): Omit<PlaceSearchResult, "image"> {
  return {
    googlePlaceId: item.googlePlaceId,
    name: item.name,
    category: item.primaryTypeDisplayName || item.primaryType,
    address: item.formattedAddress,
    rating: item.rating,
    userRatingCount: item.userRatingCount,
    isOpen: item.openNow,
    location: item.location,
    photoName: item.photoName ?? "",
  };
}

export async function fetchPlacesPageWithPhotos(args: {
  query: string;
  latitude: number;
  longitude: number;
  radius: number | undefined;
  pageSize: number;
  pageToken: string | undefined;
}): Promise<PlaceSearchPage> {
  const { items: rawItems, nextPageToken } = await searchPlaces({
    query: args.query,
    latitude: args.latitude,
    longitude: args.longitude,
    radius: args.radius,
    pageSize: args.pageSize,
    pageToken: args.pageToken,
  });

  const items = await Promise.all(
    rawItems.map(async (item) => {
      const base = mapPlaceSearchItem(item);
      let imageUrl: string | undefined;
      const photoName = item.photoName?.trim();
      if (photoName) {
        try {
          imageUrl = await fetchPlacePhotoUrl(photoName);
        } catch {
          // Photo fetch failures are non-fatal
        }
      }
      return { ...base, image: imageUrl };
    }),
  );

  return { items, nextPageToken };
}

export function placesSearchQueryKey(
  query: string,
  latitude: number | null,
  longitude: number | null,
  radius: number | undefined,
  pageSize: number,
  pageIndex: number,
) {
  return [
    "places",
    "search",
    query,
    latitude,
    longitude,
    radius,
    pageSize,
    pageIndex,
  ] as const;
}

type SearchSessionKey = string;

function buildSearchSessionKey(
  query: string,
  latitude: number,
  longitude: number,
  radius: number | undefined,
  pageSize: number,
): SearchSessionKey {
  return [query, latitude, longitude, radius ?? "", pageSize].join("|");
}

function sessionKeyFromPlacesSearchQueryKey(
  queryKey: readonly unknown[],
): SearchSessionKey {
  return [queryKey[2], queryKey[3], queryKey[4], queryKey[5], queryKey[6]].join(
    "|",
  );
}

export function usePlacesSearch(
  query: string,
  latitude: number | null,
  longitude: number | null,
  radius: number | undefined,
  pageSize: number,
  /** 검색·재검색 커밋마다 증가 — pageToken·pageIndex를 0으로 동기 리셋 */
  searchGeneration: number,
) {
  const trimmedQuery = query.trim();
  const enabled =
    trimmedQuery.length > 0 &&
    latitude !== null &&
    longitude !== null &&
    pageSize > 0;

  const sessionKey = enabled
    ? buildSearchSessionKey(trimmedQuery, latitude!, longitude!, radius, pageSize)
    : "";

  const paginationEpoch = enabled
    ? `${sessionKey}@${searchGeneration}`
    : `disabled@${searchGeneration}`;

  const [pageIndex, setPageIndex] = useState(0);
  const pageTokensRef = useRef<(string | undefined)[]>([undefined]);
  const paginationEpochRef = useRef(paginationEpoch);

  if (paginationEpoch !== paginationEpochRef.current) {
    paginationEpochRef.current = paginationEpoch;
    pageTokensRef.current = [undefined];
    if (pageIndex !== 0) {
      setPageIndex(0);
    }
  }

  const pageToken = pageTokensRef.current[pageIndex];

  const queryResult = useQuery({
    queryKey: placesSearchQueryKey(
      trimmedQuery,
      latitude,
      longitude,
      radius,
      pageSize,
      pageIndex,
    ),
    queryFn: () =>
      fetchPlacesPageWithPhotos({
        query: trimmedQuery,
        latitude: latitude!,
        longitude: longitude!,
        radius,
        pageSize,
        pageToken,
      }),
    enabled,
    staleTime: 30_000,
    placeholderData: (previousData, previousQuery) => {
      if (!previousData || !previousQuery) return undefined;
      return sessionKeyFromPlacesSearchQueryKey(previousQuery.queryKey) ===
        sessionKey
        ? previousData
        : undefined;
    },
  });

  useEffect(() => {
    if (paginationEpochRef.current !== paginationEpoch) return;
    const next = queryResult.data?.nextPageToken;
    if (!next) return;
    pageTokensRef.current[pageIndex + 1] = next;
  }, [queryResult.data?.nextPageToken, pageIndex, paginationEpoch]);

  const items = queryResult.data?.items ?? [];
  const hasNextPage = Boolean(queryResult.data?.nextPageToken);
  const hasPreviousPage = pageIndex > 0;

  const goToPreviousPage = useCallback(() => {
    setPageIndex((i) => Math.max(0, i - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    if (!hasNextPage) return;
    if (pageTokensRef.current[pageIndex + 1] === undefined) return;
    setPageIndex((i) => i + 1);
  }, [hasNextPage, pageIndex]);

  return {
    items,
    pageIndex,
    hasPreviousPage,
    hasNextPage,
    goToPreviousPage,
    goToNextPage,
    isPending: queryResult.isPending,
    isFetching: queryResult.isFetching,
    isError: queryResult.isError,
    isSuccess: queryResult.isSuccess,
    error: queryResult.error,
  };
}
