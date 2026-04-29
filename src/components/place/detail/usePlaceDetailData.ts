import { useQuery } from "@tanstack/react-query";
import { getPlaceDetail, getPlacePhotoUrl } from "@/lib/api/places";
import type { PlaceDetailResult } from "./types";

export function usePlaceDetailData(googlePlaceId?: string) {
  return useQuery<PlaceDetailResult>({
    queryKey: ["place-detail", googlePlaceId],
    queryFn: async () => {
      const detail = await getPlaceDetail(googlePlaceId!);
      const photoUrls = (
        await Promise.all(
          detail.photoNames.slice(0, 9).map(async (n) => {
            try {
              return await getPlacePhotoUrl(n);
            } catch {
              return null;
            }
          }),
        )
      ).filter((u): u is string => u !== null);
      return {
        photoUrls,
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
    enabled: !!googlePlaceId,
    staleTime: 60_000,
  });
}
