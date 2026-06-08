import type { QueryClient } from "@tanstack/react-query";

import type {
  PlacePhotoNamesBatchItem,
  PlacePhotoUrlBatchItem,
  PlacePreviewBatchItem,
} from "@/lib/api/places";
import {
  requestPlacePhotoNamesBatch,
  requestPlacePhotoUrlsBatch,
  requestPlacePreviewsBatch,
} from "@/lib/api/places";
import { isBatchItemOk } from "@/lib/api/batch-types";
import {
  placePhotoUrlQueryDefaults,
  placePhotoUrlQueryKey,
} from "@/lib/place-photo-query";
import {
  normalizePlacePreview,
  placePhotoNamesQueryDefaults,
  placePhotoNamesQueryKey,
  placePreviewQueryDefaults,
  placePreviewQueryKey,
  resolvePreviewGooglePlaceId,
} from "@/lib/places/place-queries";
import { getQueryClient } from "@/lib/query-client";

function previewBatchItemToNormalized(
  item: PlacePreviewBatchItem,
): ReturnType<typeof normalizePlacePreview> | null {
  if (!isBatchItemOk(item)) return null;
  return normalizePlacePreview({
    googlePlaceId: item.googlePlaceId,
    name: item.name,
    formattedAddress: item.formattedAddress,
    location: item.location,
    photoName: item.photoName,
    primaryType: item.primaryType,
    primaryTypeDisplayName: item.primaryTypeDisplayName,
  });
}

export function seedPlacePreviewCaches(
  queryClient: QueryClient,
  items: readonly PlacePreviewBatchItem[],
): void {
  for (const item of items) {
    const preview = previewBatchItemToNormalized(item);
    if (!preview) continue;
    const id = resolvePreviewGooglePlaceId(preview.googlePlaceId);
    if (!id.length) continue;
    queryClient.setQueryData(placePreviewQueryKey(id), preview, {
      updatedAt: Date.now(),
    });
  }
}

export function seedPlacePhotoNamesCaches(
  queryClient: QueryClient,
  items: readonly PlacePhotoNamesBatchItem[],
): void {
  for (const item of items) {
    if (!isBatchItemOk(item)) continue;
    const id =
      typeof item.googlePlaceId === "string" ? item.googlePlaceId.trim() : "";
    if (!id.length) continue;
    const names = Array.isArray(item.photoNames)
      ? item.photoNames
          .map((n) => (typeof n === "string" ? n.trim() : ""))
          .filter((n) => n.length > 0)
      : [];
    queryClient.setQueryData(placePhotoNamesQueryKey(id), names, {
      updatedAt: Date.now(),
    });
  }
}

export function seedPlacePhotoUrlCaches(
  queryClient: QueryClient,
  items: readonly PlacePhotoUrlBatchItem[],
): void {
  for (const item of items) {
    if (!isBatchItemOk(item)) continue;
    const name =
      typeof item.photoName === "string" ? item.photoName.trim() : "";
    const url = typeof item.photoUrl === "string" ? item.photoUrl.trim() : "";
    if (!name.length || !url.length) continue;
    queryClient.setQueryData(placePhotoUrlQueryKey(name), url, {
      updatedAt: Date.now(),
    });
  }
}

function uncachedPreviewIds(
  queryClient: QueryClient,
  googlePlaceIds: readonly string[],
): string[] {
  const out: string[] = [];
  for (const raw of googlePlaceIds) {
    const id = resolvePreviewGooglePlaceId(raw);
    if (!id.length) continue;
    const cached = queryClient.getQueryData(placePreviewQueryKey(id));
    if (cached != null) continue;
    out.push(id);
  }
  return [...new Set(out)];
}

function uncachedPhotoNameIds(
  queryClient: QueryClient,
  googlePlaceIds: readonly string[],
): string[] {
  const out: string[] = [];
  for (const raw of googlePlaceIds) {
    const id = typeof raw === "string" ? raw.trim() : "";
    if (!id.length) continue;
    const cached = queryClient.getQueryData(placePhotoNamesQueryKey(id));
    if (cached != null) continue;
    out.push(id);
  }
  return [...new Set(out)];
}

function uncachedPhotoNames(
  queryClient: QueryClient,
  photoNames: readonly string[],
): string[] {
  const out: string[] = [];
  for (const raw of photoNames) {
    const name = typeof raw === "string" ? raw.trim() : "";
    if (!name.length) continue;
    const cached = queryClient.getQueryData(placePhotoUrlQueryKey(name));
    if (cached != null) continue;
    out.push(name);
  }
  return [...new Set(out)];
}

export async function fetchAndSeedPlacePreviews(
  googlePlaceIds: readonly string[],
  queryClient?: QueryClient | null,
): Promise<void> {
  const qc = queryClient ?? getQueryClient();
  if (!qc) return;

  const missing = uncachedPreviewIds(qc, googlePlaceIds);
  if (!missing.length) return;

  const results = await requestPlacePreviewsBatch(missing);
  seedPlacePreviewCaches(qc, results);
}

export async function fetchAndSeedPlacePhotoNames(
  googlePlaceIds: readonly string[],
  queryClient?: QueryClient | null,
): Promise<void> {
  const qc = queryClient ?? getQueryClient();
  if (!qc) return;

  const missing = uncachedPhotoNameIds(qc, googlePlaceIds);
  if (!missing.length) return;

  const results = await requestPlacePhotoNamesBatch(missing);
  seedPlacePhotoNamesCaches(qc, results);
}

export async function fetchAndSeedPlacePhotoUrls(
  photoNames: readonly string[],
  queryClient?: QueryClient | null,
): Promise<void> {
  const qc = queryClient ?? getQueryClient();
  if (!qc) return;

  const missing = uncachedPhotoNames(qc, photoNames);
  if (!missing.length) return;

  const results = await requestPlacePhotoUrlsBatch(missing);
  seedPlacePhotoUrlCaches(qc, results);
}

/** batch 시딩 후 개별 query key에 데이터가 있도록 defaults와 함께 prefetch */
export async function ensurePlacePhotoUrlsCached(
  photoNames: readonly string[],
  queryClient?: QueryClient | null,
): Promise<void> {
  const qc = queryClient ?? getQueryClient();
  if (!qc) return;

  await fetchAndSeedPlacePhotoUrls(photoNames, qc);

  for (const raw of photoNames) {
    const name = typeof raw === "string" ? raw.trim() : "";
    if (!name.length) continue;
    const cached = qc.getQueryData<string>(placePhotoUrlQueryKey(name));
    if (cached == null) continue;
    qc.setQueryData(placePhotoUrlQueryKey(name), cached, {
      updatedAt: Date.now(),
    });
  }
}

export {
  placePhotoNamesQueryDefaults,
  placePhotoUrlQueryDefaults,
  placePreviewQueryDefaults,
};
