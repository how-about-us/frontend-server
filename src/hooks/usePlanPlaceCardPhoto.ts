import { usePlacePhotoUrlQuery } from "@/hooks/usePlacePhotoUrl";
import type { PlanPlace } from "@/lib/plan/types";

/** Plan 카드 썸네일 — 캐시 우선, 미시딩 시 `GET /places/photos`로 개별 조회 */
export function usePlanPlaceCardPhoto(place: PlanPlace) {
  const fallbackPhotoUrl =
    typeof place.imageUrl === "string" && place.imageUrl.trim().length > 0
      ? place.imageUrl.trim()
      : null;
  const photoName =
    typeof place.photoName === "string" && place.photoName.trim().length > 0
      ? place.photoName.trim()
      : null;

  const photoQuery = usePlacePhotoUrlQuery(photoName);

  const resolvedPhotoUrl = photoName
    ? photoQuery.data?.trim() || fallbackPhotoUrl
    : fallbackPhotoUrl;

  return {
    resolvedPhotoUrl,
    photoLoading:
      Boolean(photoName) && photoQuery.isLoading && !resolvedPhotoUrl,
  };
}
