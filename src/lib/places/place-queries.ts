import type { SearchResultCardProps } from "@/types/place";

import {
  requestPlaceDetail,
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

export function placeDetailQueryKey(googlePlaceId: string) {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return ["places", "detail", id] as const;
}

export function placePreviewQueryKey(googlePlaceId: string) {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return ["places", "preview", id] as const;
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

function resolvePreviewGooglePlaceId(googlePlaceId: string): string {
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

/** Preview API + first photo for bookmark/plan list cards. */
export async function fetchPlaceCardProps(
  googlePlaceId: string,
): Promise<SearchResultCardProps> {
  const preview = await fetchPlacePreview(googlePlaceId);
  let image: string | undefined;
  if (preview.photoName) {
    try {
      image = await fetchPlacePhotoUrl(preview.photoName);
    } catch {
      /* photo optional */
    }
  }
  return {
    name: preview.name,
    category: "",
    rating: null,
    address: preview.formattedAddress,
    googlePlaceId: preview.googlePlaceId,
    location: preview.location,
    image,
  };
}
