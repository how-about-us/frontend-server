import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { requestPlacePhotoUrl } from "@/lib/api/places";
import {
  placePhotoUrlQueryDefaults,
  placePhotoUrlQueryKey,
} from "@/lib/place-photo-query";

export function usePlacePhotoUrlQuery(photoName: string | null | undefined) {
  const name = typeof photoName === "string" ? photoName.trim() : "";
  return useQuery({
    queryKey: placePhotoUrlQueryKey(name),
    // queryFn 안에서 fetchPlacePhotoUrl(동일 queryKey fetchQuery)을 쓰면 대기 데드락
    queryFn: () => requestPlacePhotoUrl(name),
    enabled: name.length > 0,
    ...placePhotoUrlQueryDefaults,
  });
}

/**
 * 여러 photoName을 단일 카드와 동일한 `["places","photoUrl",name]` 캐시 키로 해석.
 * 같은 name은 캐시 재사용 → 불필요한 `/places/photos` 재호출 방지.
 */
export function usePlacePhotoUrlsQuery(
  photoNames: readonly (string | null | undefined)[] | null | undefined,
) {
  const names = useMemo(
    () =>
      (photoNames ?? [])
        .map((n) => (typeof n === "string" ? n.trim() : ""))
        .filter((n) => n.length > 0),
    [photoNames],
  );

  const results = useQueries({
    queries: names.map((name) => ({
      queryKey: placePhotoUrlQueryKey(name),
      queryFn: () => requestPlacePhotoUrl(name),
      enabled: name.length > 0,
      ...placePhotoUrlQueryDefaults,
    })),
  });

  const photoUrls = useMemo(
    () =>
      results
        .map((r) => (typeof r.data === "string" ? r.data.trim() : ""))
        .filter((u) => u.length > 0),
    [results],
  );

  const isLoading = names.length > 0 && results.some((r) => r.isLoading);

  return { photoUrls, isLoading };
}
