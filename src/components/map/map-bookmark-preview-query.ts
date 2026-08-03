import type { QueryClient } from "@tanstack/react-query";

import { fetchAndSeedPlacePreviews } from "@/lib/places/place-batch-cache";
import { placePreviewQueryOptions } from "@/lib/places/place-queries";

import { filterVisibleMapBookmarks } from "./filter-visible-map-bookmarks";

const PREVIEW_IDS_KEY_SEPARATOR = "\u0000";

type MapBookmarkRow = {
  googlePlaceId: string;
};

type PreviewBatchLoader = (
  googlePlaceIds: readonly string[],
  queryClient?: QueryClient | null,
) => Promise<void>;

export function mapBookmarkPreviewQueryOptions(
  googlePlaceId: string,
  batchSettled: boolean,
) {
  const options = placePreviewQueryOptions(googlePlaceId);
  return {
    ...options,
    enabled: batchSettled && options.enabled,
  };
}

export function buildMapBookmarkPreviewPlan<T extends MapBookmarkRow>(
  rows: readonly T[],
  hiddenNormalizedPlaceIds: ReadonlySet<string> | undefined,
  settledPreviewIdsKey: string | null,
) {
  const visibleBookmarks = filterVisibleMapBookmarks(
    rows,
    hiddenNormalizedPlaceIds,
  );
  const previewIds = visibleBookmarks.map((row) => row.googlePlaceId);
  const previewIdsKey = previewIds.join(PREVIEW_IDS_KEY_SEPARATOR);
  const batchSettled =
    previewIds.length === 0 || settledPreviewIdsKey === previewIdsKey;

  return {
    visibleBookmarks,
    previewIdsKey,
    queryOptions: visibleBookmarks.map((row) =>
      mapBookmarkPreviewQueryOptions(row.googlePlaceId, batchSettled),
    ),
  };
}

export async function settleMapBookmarkPreviewBatch(
  previewIdsKey: string,
  queryClient: QueryClient,
  loader: PreviewBatchLoader = fetchAndSeedPlacePreviews,
): Promise<string> {
  const previewIds = previewIdsKey.length
    ? previewIdsKey.split(PREVIEW_IDS_KEY_SEPARATOR)
    : [];

  try {
    await loader(previewIds, queryClient);
  } catch {
    // 벌크 실패 시 key를 정착시켜 React Query의 개별 조회 fallback을 허용합니다.
  }
  return previewIdsKey;
}
