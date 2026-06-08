import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  placePhotoUrlQueryDefaults,
  placePhotoUrlQueryKey,
} from "@/lib/place-photo-query";
import type { PlanPlace } from "@/lib/plan/types";

/** Plan 카드 썸네일 — room hydrate가 시딩한 photo URL 캐시만 구독 (개별 GET 없음) */
export function usePlanPlaceCardPhoto(place: PlanPlace) {
  const queryClient = useQueryClient();
  const fallbackPhotoUrl =
    typeof place.imageUrl === "string" && place.imageUrl.trim().length > 0
      ? place.imageUrl.trim()
      : null;
  const photoName =
    typeof place.photoName === "string" && place.photoName.trim().length > 0
      ? place.photoName.trim()
      : null;

  const photoQuery = useQuery({
    queryKey: placePhotoUrlQueryKey(photoName ?? ""),
    queryFn: (): string => {
      const cached = queryClient.getQueryData<string>(
        placePhotoUrlQueryKey(photoName!),
      );
      return typeof cached === "string" ? cached.trim() : "";
    },
    enabled: Boolean(photoName),
    initialData: () => {
      if (!photoName) return undefined;
      const cached = queryClient.getQueryData<string>(
        placePhotoUrlQueryKey(photoName),
      );
      return typeof cached === "string" ? cached.trim() : undefined;
    },
    ...placePhotoUrlQueryDefaults,
    retry: false,
  });

  const resolvedPhotoUrl = photoName
    ? photoQuery.data?.trim() || fallbackPhotoUrl
    : fallbackPhotoUrl;

  return {
    resolvedPhotoUrl,
    photoLoading: false,
  };
}
