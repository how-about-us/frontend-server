import { useQuery } from "@tanstack/react-query";
import {
  fetchPlaceDetail,
  placeDetailQueryDefaults,
} from "@/lib/places/place-queries";
import type { PlaceDetailResult } from "./types";

export function usePlaceDetailData(googlePlaceId?: string) {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return useQuery<PlaceDetailResult>({
    queryKey: ["places", "detail-panel", id],
    queryFn: async () => {
      const detail = await fetchPlaceDetail(id);
      const photoNames = (detail.photoNames ?? [])
        .map((n) => (typeof n === "string" ? n.trim() : ""))
        .filter((n) => n.length > 0)
        .slice(0, 9);
      return {
        name: detail.name,
        primaryTypeDisplayName: detail.primaryTypeDisplayName,
        rating: detail.rating,
        photoNames,
        photoName: photoNames[0] ?? "",
        formattedAddress: detail.formattedAddress,
        location: detail.location,
        phone: detail.phoneNumber,
        websiteUri: detail.websiteUri,
        googleMapsUri: detail.googleMapsUri,
        reviewsUri: detail.googleMapsLinks?.reviewsUri ?? null,
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
