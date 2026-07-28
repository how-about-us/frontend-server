import type { QueryClient } from "@tanstack/react-query";

import type { ServerChatMessage } from "@/types/chat";

/**
 * 채팅 히스토리 로드 직후 호출됩니다.
 * 사진 URL은 카드가 뷰포트에 들어올 때 조회하므로 여기서는 예열하지 않습니다.
 */
export async function warmPlacePhotoQueriesFromChatHistory(
  queryClient: QueryClient,
  history: ServerChatMessage[],
): Promise<void> {
  void queryClient;
  void history;
}
