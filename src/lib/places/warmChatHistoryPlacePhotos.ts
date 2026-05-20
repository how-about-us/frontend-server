import type { QueryClient } from "@tanstack/react-query";

import { getPlacePhotoUrl } from "@/lib/api/places";
import {
  collectGooglePlaceIdsForAiPhotoBackfill,
  collectPlacePhotoNamesFromServerMessages,
} from "@/lib/chat";
import { resolvePlaceCardEnrichmentFromPlaceId } from "@/lib/places/placeCardEnrichment";
import { placePhotoUrlQueryKey } from "@/lib/place-photo-query";
import type { ServerChatMessage } from "@/types/chat";

/**
 * 채팅 히스토리 로드 직후 1회 — 메타의 `photoName`·AI 추천 place 디테일로 모은 이름에 대해
 * `/places/photos`를 채워 React Query 캐시(+ `getPlacePhotoUrl` 모듈 메모)에 적재합니다.
 */
export async function warmPlacePhotoQueriesFromChatHistory(
  queryClient: QueryClient,
  history: ServerChatMessage[],
): Promise<void> {
  const names = new Set(collectPlacePhotoNamesFromServerMessages(history));

  const backfillResults = await Promise.allSettled(
    collectGooglePlaceIdsForAiPhotoBackfill(history).map((placeId) =>
      resolvePlaceCardEnrichmentFromPlaceId(placeId),
    ),
  );
  for (const r of backfillResults) {
    if (r.status !== "fulfilled" || !r.value?.photoName) continue;
    const pn =
      typeof r.value.photoName === "string" ? r.value.photoName.trim() : "";
    if (pn.length > 0) names.add(pn);
  }

  await Promise.allSettled(
    [...names].map(async (name) => {
      const url = await getPlacePhotoUrl(name);
      queryClient.setQueryData(placePhotoUrlQueryKey(name), url);
    }),
  );
}
