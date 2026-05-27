import { useQuery } from "@tanstack/react-query";
import {
  fetchPlaceDetail,
  fetchPlacePhotoUrl,
  placeDetailQueryDefaults,
} from "@/lib/places/place-queries";
import type { PlaceDetailResult } from "./types";

export function usePlaceDetailData(googlePlaceId?: string) {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return useQuery<PlaceDetailResult>({
    queryKey: ["places", "detail-panel", id],
    queryFn: async () => {
      const detail = await fetchPlaceDetail(id);
      const photoUrls = (
        await Promise.all(
          detail.photoNames.slice(0, 9).map(async (n) => {
            try {
              return await fetchPlacePhotoUrl(n);
            } catch {
              return null;
            }
          }),
        )
      ).filter((u): u is string => u !== null);
      return {
        name: detail.name,
        primaryTypeDisplayName: detail.primaryTypeDisplayName,
        rating: detail.rating,
        photoUrls,
        photoName: detail.photoNames[0] ?? "",
        formattedAddress: detail.formattedAddress,
        location: detail.location,
        phone: detail.phoneNumber,
        websiteUri: detail.websiteUri,
        googleMapsUri: detail.googleMapsUri,
        openNow: detail.regularOpeningHours?.openNow ?? null,
        weekdayDescriptions: detail.regularOpeningHours?.weekdayDescriptions ?? [],
        userRatingCount: detail.userRatingCount,
        reviewSummary: detail.reviewSummary,
        reviews: detail.reviews ?? [],
      };
    },
    enabled: id.length > 0,
    ...placeDetailQueryDefaults,
  });
}
