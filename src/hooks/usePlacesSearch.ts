import { useQuery } from "@tanstack/react-query";
import {
  searchPlaces,
  type PlaceSearchItem,
} from "@/lib/api/places";
import { fetchPlacePhotoUrl } from "@/lib/places/place-queries";
import type { SearchResultCardProps } from "@/types/place";

/** 검색 페이지에서 한 요청당 최대 장소 개수(서버 `limit` + 클라 보정·썸네일 호출 상한) */
export const PLACES_SEARCH_MAX_RESULTS = 10;

export type PlaceSearchResult = SearchResultCardProps & {
  googlePlaceId: string;
  location: { lat: number; lng: number };
  /** 채팅으로 공유 시 STOMP payload 에 그대로 전달되는 원본 photoName */
  photoName: string;
};

async function fetchPlacesWithPhotos(
  query: string,
  latitude: number,
  longitude: number,
  radius: number | undefined,
  maxResults: number,
): Promise<PlaceSearchResult[]> {
  const raw: PlaceSearchItem[] = await searchPlaces({
    query,
    latitude,
    longitude,
    radius,
    limit: maxResults,
  });

  const items = raw.slice(0, maxResults);

  // Fetch photo URLs in parallel (최대 maxResults건)
  const results = await Promise.all(
    items.map(async (item) => {
      let imageUrl: string | undefined;
      try {
        imageUrl = await fetchPlacePhotoUrl(item.photoName);
      } catch {
        // Photo fetch failures are non-fatal
      }

      const result: PlaceSearchResult = {
        googlePlaceId: item.googlePlaceId,
        name: item.name,
        category: item.primaryTypeDisplayName || item.primaryType,
        address: item.formattedAddress,
        rating: item.rating,
        userRatingCount: item.userRatingCount,
        isOpen: item.openNow,
        image: imageUrl,
        location: item.location,
        photoName: item.photoName ?? "",
      };
      return result;
    }),
  );

  return results;
}

export function placesSearchQueryKey(
  query: string,
  latitude: number | null,
  longitude: number | null,
  radius?: number,
) {
  return [
    "places",
    "search",
    query,
    latitude,
    longitude,
    radius,
    PLACES_SEARCH_MAX_RESULTS,
  ] as const;
}

export function usePlacesSearch(
  query: string,
  latitude: number | null,
  longitude: number | null,
  radius?: number,
) {
  return useQuery({
    queryKey: placesSearchQueryKey(query, latitude, longitude, radius),
    queryFn: () =>
      fetchPlacesWithPhotos(
        query,
        latitude!,
        longitude!,
        radius,
        PLACES_SEARCH_MAX_RESULTS,
      ),
    enabled: query.trim().length > 0 && latitude !== null && longitude !== null,
    staleTime: 30_000,
  });
}
