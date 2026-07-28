import type { QueryClient } from "@tanstack/react-query";

import { collectGooglePlaceIdsFromServerMessages } from "@/lib/chat";
import { fetchAndSeedPlacePhotoUrls } from "@/lib/places/place-batch-cache";
import type { ServerChatMessage } from "@/types/chat";

/**
 * 채팅 히스토리 로드 직후 1회 — PLACE_SHARE·AI 추천의 googlePlaceId에 대해
 * `/places/photos`를 React Query 캐시에 예열합니다. 기존 metadata.photoName은 무시합니다.
 */
export async function warmPlacePhotoQueriesFromChatHistory(
  queryClient: QueryClient,
  history: ServerChatMessage[],
): Promise<void> {
  const googlePlaceIds = collectGooglePlaceIdsFromServerMessages(history);
  if (googlePlaceIds.length) {
    await fetchAndSeedPlacePhotoUrls(googlePlaceIds, queryClient);
  }
}
