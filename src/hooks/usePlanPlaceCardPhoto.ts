import { usePlacePhotoUrlQuery } from "@/hooks/usePlacePhotoUrl";
import type { PlanPlace } from "@/lib/plan/types";

/** Plan 카드 썸네일 — 캐시 우선, 미시딩 시 placeId 기준 `GET /places/photos`로 조회 */
export function usePlanPlaceCardPhoto(place: PlanPlace) {
  const fallbackPhotoUrl =
    typeof place.imageUrl === "string" && place.imageUrl.trim().length > 0
      ? place.imageUrl.trim()
      : null;
  const googlePlaceId =
    typeof place.googlePlaceId === "string" && place.googlePlaceId.trim().length > 0
      ? place.googlePlaceId.trim()
      : null;

  const photoQuery = usePlacePhotoUrlQuery(googlePlaceId);

  const resolvedPhotoUrl = googlePlaceId
    ? photoQuery.data?.trim() || fallbackPhotoUrl
    : fallbackPhotoUrl;

  return {
    resolvedPhotoUrl,
    photoLoading:
      Boolean(googlePlaceId) && photoQuery.isLoading && !resolvedPhotoUrl,
  };
}
