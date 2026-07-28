import { getQueryClient } from "@/lib/query-client";

/**
 * `usePlacePhotoUrlQuery` — 같은 `googlePlaceId`에 대해 불필요한 `GET /places/photos` 재호출 방지.
 */
export const PLACE_PHOTO_QUERY_GC_MS = 7 * 24 * 60 * 60 * 1000;

export const placePhotoUrlQueryDefaults = {
  staleTime: Infinity,
  gcTime: PLACE_PHOTO_QUERY_GC_MS,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  retry: 2,
} as const;

export function placePhotoUrlQueryKey(googlePlaceId: string) {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return ["places", "photoUrl", id] as const;
}

/** batch 시딩 후 캐시만 구독 — `GET /places/photos` fallback 없음 */
export function seededPlacePhotoUrlQueryOptions(
  googlePlaceId: string,
  options?: { enabled?: boolean },
) {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  const enabled = (options?.enabled ?? true) && id.length > 0;
  return {
    queryKey: placePhotoUrlQueryKey(id),
    queryFn: (): string => {
      const cached = getQueryClient()?.getQueryData<string>(placePhotoUrlQueryKey(id));
      return typeof cached === "string" ? cached.trim() : "";
    },
    enabled,
    ...placePhotoUrlQueryDefaults,
    retry: false,
  };
}
