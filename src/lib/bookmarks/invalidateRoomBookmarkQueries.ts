import type { QueryClient } from "@tanstack/react-query";

import {
  bookmarkCategoriesQueryKey,
  placeCardBookmarkRootQueryKey,
  roomBookmarksByRoomRootQueryKey,
} from "@/lib/queryKeys/bookmarks";

/** 북마크 STOMP 브로드캐스트 등 — 카테고리·북마크 목록 refetch + 해당 방 장소 카드 캐시 제거 */
export async function invalidateRoomBookmarkQueries(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  const rid = String(roomId ?? "").trim();
  if (!rid) return;

  queryClient.removeQueries({
    queryKey: placeCardBookmarkRootQueryKey(rid),
  });

  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: bookmarkCategoriesQueryKey(rid),
      refetchType: "all",
    }),
    queryClient.invalidateQueries({
      queryKey: roomBookmarksByRoomRootQueryKey(rid),
      refetchType: "all",
    }),
  ]);
}
