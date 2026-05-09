/**
 * `usePlacePhotoUrlQuery` / 룸 커버 사진 — 같은 `photoName`에 대해 불필요한 `GET /places/photos` 재호출 방지.
 * `room-cover-query` persist(dehydrate)와 맞추려면 staleTime을 길게 두는 것이 안전합니다.
 */
export const PLACE_PHOTO_QUERY_GC_MS = 7 * 24 * 60 * 60 * 1000;

export const placePhotoUrlQueryDefaults = {
  staleTime: Infinity,
  gcTime: PLACE_PHOTO_QUERY_GC_MS,
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;
