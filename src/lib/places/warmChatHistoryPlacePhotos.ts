import type { QueryClient } from "@tanstack/react-query";

import {
  collectGooglePlaceIdsForAiPhotoBackfill,
  collectPlacePhotoNamesFromServerMessages,
} from "@/lib/chat";
import {
  fetchAndSeedPlacePhotoNames,
  fetchAndSeedPlacePhotoUrls,
} from "@/lib/places/place-batch-cache";
import { placePhotoNamesQueryKey } from "@/lib/places/place-queries";
import type { ServerChatMessage } from "@/types/chat";

/**
 * 채팅 히스토리 로드 직후 1회 — 메타의 `photoName`·AI 추천 place photo-names로 모은 이름에 대해
 * `/places/photos`를 React Query 캐시에 예열합니다.
 */
export async function warmPlacePhotoQueriesFromChatHistory(
  queryClient: QueryClient,
  history: ServerChatMessage[],
): Promise<void> {
  const names = new Set(collectPlacePhotoNamesFromServerMessages(history));

  const backfillPlaceIds = collectGooglePlaceIdsForAiPhotoBackfill(history);
  if (backfillPlaceIds.length) {
    await fetchAndSeedPlacePhotoNames(backfillPlaceIds, queryClient);
    for (const placeId of backfillPlaceIds) {
      const cached = queryClient.getQueryData<string[]>(
        placePhotoNamesQueryKey(placeId.trim()),
      );
      const first = cached?.[0]?.trim();
      if (first) names.add(first);
    }
  }

  if (names.size) {
    await fetchAndSeedPlacePhotoUrls([...names], queryClient);
  }
}
