import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import {
  DEFAULT_PHOTO_SIZE,
  requestPlacePhotoUrl,
  type PhotoSize,
} from "@/lib/api/places";
import { fetchAndSeedPlacePhotoUrls } from "@/lib/places/place-batch-cache";
import {
  placePhotoUrlQueryDefaults,
  placePhotoUrlQueryKey,
  seededPlacePhotoUrlQueryOptions,
} from "@/lib/place-photo-query";
import { getQueryClient } from "@/lib/query-client";

export function usePlacePhotoUrlQuery(
  photoName: string | null | undefined,
  size: PhotoSize = DEFAULT_PHOTO_SIZE,
) {
  const name = typeof photoName === "string" ? photoName.trim() : "";
  return useQuery({
    queryKey: placePhotoUrlQueryKey(name, size),
    // queryFn 안에서 fetchPlacePhotoUrl(동일 queryKey fetchQuery)을 쓰면 대기 데드락
    queryFn: async () => {
      const cached = getQueryClient()?.getQueryData<string>(
        placePhotoUrlQueryKey(name, size),
      );
      if (typeof cached === "string" && cached.trim().length > 0) {
        return cached.trim();
      }
      return requestPlacePhotoUrl(name, size);
    },
    enabled: name.length > 0,
    ...placePhotoUrlQueryDefaults,
  });
}

export function useSeededPlacePhotoUrlQuery(
  photoName: string | null | undefined,
  options?: { enabled?: boolean; size?: PhotoSize },
) {
  const name = typeof photoName === "string" ? photoName.trim() : "";
  return useQuery(
    seededPlacePhotoUrlQueryOptions(name, {
      enabled: (options?.enabled ?? true) && name.length > 0,
      size: options?.size,
    }),
  );
}

/**
 * 여러 photoName을 단일 카드와 동일한 `["places","photoUrl",name,size]` 캐시 키로 해석.
 * 미캐시 name은 batch API 1회로 시딩 후 개별 query subscribe.
 */
export function usePlacePhotoUrlsQuery(
  photoNames: readonly (string | null | undefined)[] | null | undefined,
  size: PhotoSize = DEFAULT_PHOTO_SIZE,
) {
  const names = useMemo(
    () =>
      (photoNames ?? [])
        .map((n) => (typeof n === "string" ? n.trim() : ""))
        .filter((n) => n.length > 0),
    [photoNames],
  );

  const namesKey = names.join("\0");
  const [photosSeeded, setPhotosSeeded] = useState(false);

  useEffect(() => {
    if (!namesKey.length) {
      setPhotosSeeded(true);
      return;
    }

    let cancelled = false;
    setPhotosSeeded(false);
    void fetchAndSeedPlacePhotoUrls(names, getQueryClient(), size).then(() => {
      if (!cancelled) setPhotosSeeded(true);
    });

    return () => {
      cancelled = true;
    };
  }, [namesKey, names, size]);

  const results = useQueries({
    queries: names.map((name) =>
      seededPlacePhotoUrlQueryOptions(name, { enabled: photosSeeded, size }),
    ),
  });

  const photoUrls = useMemo(
    () =>
      results
        .map((r) => (typeof r.data === "string" ? r.data.trim() : ""))
        .filter((u) => u.length > 0),
    [results],
  );

  const isLoading =
    names.length > 0 && (!photosSeeded || results.some((r) => r.isLoading));

  return { photoUrls, isLoading };
}
