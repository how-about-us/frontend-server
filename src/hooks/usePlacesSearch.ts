import { useQuery } from "@tanstack/react-query";
import {
  searchPlaces,
  getPlacePhotoUrl,
  type PlaceSearchItem,
} from "@/lib/api/places";
import type { SearchResultCardProps } from "@/components/place/SearchResultCard";

export type PlaceSearchResult = SearchResultCardProps & {
  googlePlaceId: string;
  location: { lat: number; lng: number };
};

async function fetchPlacesWithPhotos(
  query: string,
  latitude: number,
  longitude: number,
  radius?: number,
): Promise<PlaceSearchResult[]> {
  const items: PlaceSearchItem[] = await searchPlaces({
    query,
    latitude,
    longitude,
    radius,
  });

  // Fetch all photo URLs in parallel
  const results = await Promise.all(
    items.map(async (item) => {
      let imageUrl: string | undefined;
      try {
        imageUrl = await getPlacePhotoUrl(item.photoName);
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
      };
      return result;
    }),
  );

  return results;
}

export function usePlacesSearch(
  query: string,
  latitude: number | null,
  longitude: number | null,
  radius?: number,
) {
  return useQuery({
    queryKey: ["places", "search", query, latitude, longitude, radius],
    queryFn: () => fetchPlacesWithPhotos(query, latitude!, longitude!, radius),
    enabled: query.trim().length > 0 && latitude !== null && longitude !== null,
    staleTime: 30_000,
  });
}
