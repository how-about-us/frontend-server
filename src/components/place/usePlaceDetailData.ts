import { useQuery } from "@tanstack/react-query";
import {
  fetchPlaceDetail,
  fetchPlacePhotoNames,
  placeDetailQueryDefaults,
} from "@/lib/places/place-queries";
import type { PlaceDetailResult } from "./types";

export function usePlaceDetailData(googlePlaceId?: string) {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return useQuery<PlaceDetailResult>({
    queryKey: ["places", "detail-panel", id],
    queryFn: async () => {
      const [detail, allPhotoNames] = await Promise.all([
        fetchPlaceDetail(id),
        fetchPlacePhotoNames(id).catch(() => [] as string[]),
      ]);
      const photoNames = allPhotoNames.slice(0, 9);
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
