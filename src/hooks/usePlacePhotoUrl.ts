import { useEffect, useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { requestPlacePhotoUrl } from "@/lib/api/places";
import { fetchAndSeedPlacePhotoUrls } from "@/lib/places/place-batch-cache";
import {
  placePhotoUrlQueryDefaults,
  placePhotoUrlQueryKey,
} from "@/lib/place-photo-query";
import { getQueryClient } from "@/lib/query-client";

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
 * 미캐시 name은 batch API 1회로 시딩 후 개별 query subscribe.
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

  const namesKey = names.join("\0");

  useEffect(() => {
    if (!namesKey.length) return;
    void fetchAndSeedPlacePhotoUrls(names, getQueryClient());
  }, [namesKey, names]);

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
