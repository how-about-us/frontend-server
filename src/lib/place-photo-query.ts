import { DEFAULT_PHOTO_SIZE, type PhotoSize } from "@/lib/api/places";
import { getQueryClient } from "@/lib/query-client";

/**
 * `usePlacePhotoUrlQuery` — 같은 `photoName`+`size` 조합에 대해 불필요한 `GET /places/photos` 재호출 방지.
 * 서로 다른 해상도가 캐시에서 섞이지 않도록 반드시 키에 `size` 를 포함한다.
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

export function placePhotoUrlQueryKey(
  photoName: string,
  size: PhotoSize = DEFAULT_PHOTO_SIZE,
) {
  const n = typeof photoName === "string" ? photoName.trim() : "";
  return ["places", "photoUrl", n, size] as const;
}

/** batch 시딩 후 캐시만 구독 — `GET /places/photos` fallback 없음 */
export function seededPlacePhotoUrlQueryOptions(
  photoName: string,
  options?: { enabled?: boolean; size?: PhotoSize },
) {
  const name = typeof photoName === "string" ? photoName.trim() : "";
  const size = options?.size ?? DEFAULT_PHOTO_SIZE;
  const enabled = (options?.enabled ?? true) && name.length > 0;
  return {
    queryKey: placePhotoUrlQueryKey(name, size),
    queryFn: (): string => {
      const cached = getQueryClient()?.getQueryData<string>(
        placePhotoUrlQueryKey(name, size),
      );
      return typeof cached === "string" ? cached.trim() : "";
    },
    enabled,
    ...placePhotoUrlQueryDefaults,
    retry: false,
  };
}
