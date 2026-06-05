import type { QueryClient } from "@tanstack/react-query";

import {
  collectGooglePlaceIdsForAiPhotoBackfill,
  collectPlacePhotoNamesFromServerMessages,
} from "@/lib/chat";
import {
  fetchFirstPlacePhotoName,
  fetchPlacePhotoUrl,
} from "@/lib/places/place-queries";
import type { ServerChatMessage } from "@/types/chat";

/**
 * 채팅 히스토리 로드 직후 1회 — 메타의 `photoName`·AI 추천 place photo-names로 모은 이름에 대해
 * `/places/photos`를 React Query 캐시에 예열합니다.
 */
export async function warmPlacePhotoQueriesFromChatHistory(
  _queryClient: QueryClient,
  history: ServerChatMessage[],
): Promise<void> {
  const names = new Set(collectPlacePhotoNamesFromServerMessages(history));

  const backfillResults = await Promise.allSettled(
    collectGooglePlaceIdsForAiPhotoBackfill(history).map((placeId) =>
      fetchFirstPlacePhotoName(placeId),
    ),
  );
  for (const r of backfillResults) {
    if (r.status !== "fulfilled" || !r.value) continue;
    names.add(r.value);
  }

  await Promise.allSettled(
    [...names].map(async (name) => {
      await fetchPlacePhotoUrl(name);
    }),
  );
}
