import {
  requestPlaceDetail,
  requestPlacePhotoNames,
  requestPlacePhotoUrl,
  requestPlacePreview,
  type PlaceDetail,
  type PlacePreview,
  type PlacePreviewResponse,
} from "@/lib/api/places";
import { normalizeGooglePlaceResourceId } from "@/lib/maps";
import { getQueryClient } from "@/lib/query-client";
import {
  placePhotoUrlQueryDefaults,
  placePhotoUrlQueryKey,
} from "@/lib/place-photo-query";

export const placeDetailQueryDefaults = {
  staleTime: 60_000,
  refetchOnWindowFocus: false,
} as const;

export const placePreviewQueryDefaults = {
  staleTime: 60_000,
  refetchOnWindowFocus: false,
} as const;

/** 로그인 사용자별 Rate Limit 대응 — 동일 장소 사진 이름 목록 재호출 최소화 */
export const placePhotoNamesQueryDefaults = {
  staleTime: 5 * 60_000,
  refetchOnWindowFocus: false,
} as const;

export function placePhotoNamesQueryKey(googlePlaceId: string) {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return ["places", "photoNames", id] as const;
}

function placeDetailQueryKey(googlePlaceId: string) {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return ["places", "detail", id] as const;
}

export function placePreviewQueryKey(googlePlaceId: string) {
  return ["places", "preview", resolvePreviewGooglePlaceId(googlePlaceId)] as const;
}

export function normalizePreviewLocation(
  location: PlacePreviewResponse["location"] | { lat?: number; lng?: number },
): { lat: number; lng: number } | undefined {
  if (!location || typeof location !== "object") return undefined;

  const lat =
    "latitude" in location
      ? location.latitude
      : "lat" in location
        ? location.lat
        : undefined;
  const lng =
    "longitude" in location
      ? location.longitude
      : "lng" in location
        ? location.lng
        : undefined;

  if (
    typeof lat !== "number" ||
    !Number.isFinite(lat) ||
    typeof lng !== "number" ||
    !Number.isFinite(lng)
  ) {
    return undefined;
  }
  return { lat, lng };
}

function normalizeOptionalPreviewString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function normalizePlacePreview(raw: PlacePreviewResponse): PlacePreview {
  const photoName =
    typeof raw.photoName === "string" && raw.photoName.trim().length > 0
      ? raw.photoName.trim()
      : undefined;
  return {
    googlePlaceId: raw.googlePlaceId,
    name: raw.name,
    formattedAddress: raw.formattedAddress,
    location: normalizePreviewLocation(raw.location),
    photoName,
    primaryType: normalizeOptionalPreviewString(raw.primaryType),
    primaryTypeDisplayName: normalizeOptionalPreviewString(
      raw.primaryTypeDisplayName,
    ),
  };
}

export async function fetchPlaceDetail(googlePlaceId: string): Promise<PlaceDetail> {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  if (!id.length) {
    throw new Error("fetchPlaceDetail: empty googlePlaceId");
  }

  const queryClient = getQueryClient();
  if (!queryClient) {
    return requestPlaceDetail(id);
  }

  return queryClient.fetchQuery({
    queryKey: placeDetailQueryKey(id),
    queryFn: () => requestPlaceDetail(id),
    ...placeDetailQueryDefaults,
  });
}

/** useQueries queryFn 등 중첩 fetchQuery 없이 photo-names API만 호출 */
export async function loadPlacePhotoNames(
  googlePlaceId: string,
): Promise<string[]> {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  if (!id.length) {
    throw new Error("loadPlacePhotoNames: empty googlePlaceId");
  }
  const names = await requestPlacePhotoNames(id);
  return names
    .map((n) => (typeof n === "string" ? n.trim() : ""))
    .filter((n) => n.length > 0);
}

/** imperative — 동일 장소 사진 이름 목록 캐시 재사용으로 Rate Limit 반복 호출 방지 */
export async function fetchPlacePhotoNames(
  googlePlaceId: string,
): Promise<string[]> {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  if (!id.length) {
    throw new Error("fetchPlacePhotoNames: empty googlePlaceId");
  }

  const queryClient = getQueryClient();
  if (!queryClient) {
    return loadPlacePhotoNames(id);
  }

  return queryClient.fetchQuery({
    queryKey: placePhotoNamesQueryKey(id),
    queryFn: () => loadPlacePhotoNames(id),
    ...placePhotoNamesQueryDefaults,
  });
}

/** AI 카드·히스토리 warm — photo-names 첫 항목만 (실패 시 null) */
export async function fetchFirstPlacePhotoName(
  googlePlaceId: string,
): Promise<string | null> {
  try {
    const names = await fetchPlacePhotoNames(googlePlaceId);
    return names[0] ?? null;
  } catch {
    return null;
  }
}

/** `useQuery` / `useQueries`용 — `fetchPlacePhotoNames`와 동일 queryKey·캐시 */
export function placePhotoNamesQueryOptions(googlePlaceId: string) {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return {
    queryKey: placePhotoNamesQueryKey(id),
    queryFn: () => loadPlacePhotoNames(id),
    enabled: id.length > 0,
    ...placePhotoNamesQueryDefaults,
    retry: 1,
  };
}

export function resolvePreviewGooglePlaceId(googlePlaceId: string): string {
  const raw = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return raw.length ? normalizeGooglePlaceResourceId(raw) : "";
}

/** useQueries queryFn 등 중첩 fetchQuery 없이 preview API만 호출 */
export async function loadPlacePreview(googlePlaceId: string): Promise<PlacePreview> {
  const id = resolvePreviewGooglePlaceId(googlePlaceId);
  if (!id.length) {
    throw new Error("loadPlacePreview: empty googlePlaceId");
  }
  const raw = await requestPlacePreview(id);
  return normalizePlacePreview(raw);
}

/**
 * 북마크·일정 카드 등 `useQueries`용 — `fetchPlacePreview`와 동일 `placePreviewQueryKey`·60s 캐시.
 */
export function placePreviewQueryOptions(googlePlaceId: string) {
  const id = resolvePreviewGooglePlaceId(googlePlaceId);
  return {
    queryKey: placePreviewQueryKey(id),
    queryFn: () => loadPlacePreview(id),
    enabled: id.length > 0,
    ...placePreviewQueryDefaults,
    retry: 1,
  };
}

/**
 * batch 시딩 후 캐시만 구독 — GET `/preview` fallback 없음.
 * `enabled`는 batch 완료 후 true로 두세요.
 */
export function seededPlacePreviewQueryOptions(
  googlePlaceId: string,
  options?: { enabled?: boolean },
) {
  const id = resolvePreviewGooglePlaceId(googlePlaceId);
  const enabled = (options?.enabled ?? true) && id.length > 0;
  return {
    queryKey: placePreviewQueryKey(id),
    queryFn: (): PlacePreview => {
      const queryClient = getQueryClient();
      const cached = queryClient?.getQueryData<PlacePreview>(
        placePreviewQueryKey(id),
      );
      if (cached) return cached;
      throw new Error("Place preview not seeded");
    },
    enabled,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  };
}

export async function fetchPlacePreview(googlePlaceId: string): Promise<PlacePreview> {
  const id = resolvePreviewGooglePlaceId(googlePlaceId);
  if (!id.length) {
    throw new Error("fetchPlacePreview: empty googlePlaceId");
  }

  const queryClient = getQueryClient();
  if (!queryClient) {
    return loadPlacePreview(id);
  }

  return queryClient.fetchQuery({
    queryKey: placePreviewQueryKey(id),
    queryFn: () => loadPlacePreview(id),
    ...placePreviewQueryDefaults,
  });
}

/** imperative·다른 queryKey의 queryFn에서만 사용 — `usePlacePhotoUrlQuery` queryFn에는 `requestPlacePhotoUrl` */
export async function fetchPlacePhotoUrl(photoName: string): Promise<string> {
  const name = typeof photoName === "string" ? photoName.trim() : "";
  if (!name.length) {
    throw new Error("fetchPlacePhotoUrl: empty photoName");
  }

  const queryClient = getQueryClient();
  if (!queryClient) {
    return requestPlacePhotoUrl(name);
  }

  return queryClient.fetchQuery({
    queryKey: placePhotoUrlQueryKey(name),
    queryFn: () => requestPlacePhotoUrl(name),
    ...placePhotoUrlQueryDefaults,
  });
}

