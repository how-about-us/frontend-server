import type { QueryClient } from "@tanstack/react-query";

import {
  bookmarkCategoriesQueryKey,
  roomBookmarksQueryKey,
} from "@/lib/query-keys";
import type { RoomBookmarkChangedEvent } from "@/types/roomBookmarkStomp";

/** STOMP `RoomBookmarkChangedEvent.type`별 최소 범위 무효화·제거만 수행합니다. */
export async function invalidateRoomBookmarkQueries(
  queryClient: QueryClient,
  event: RoomBookmarkChangedEvent,
): Promise<void> {
  const rid = String(event.roomId ?? "").trim();
  if (!rid) return;

  const categoryId = event.categoryId;

  switch (event.type) {
    case "BOOKMARK_CREATED":
      await queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(rid, categoryId),
        refetchType: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(rid),
        refetchType: "all",
      });
      break;

    case "BOOKMARK_UPDATED":
      await queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(rid, categoryId),
        refetchType: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(rid),
        refetchType: "all",
      });
      break;

    case "BOOKMARK_DELETED":
      await queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(rid, categoryId),
        refetchType: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(rid),
        refetchType: "all",
      });
      break;

    case "CATEGORY_CREATED":
    case "CATEGORY_UPDATED":
      await queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(rid),
        refetchType: "all",
      });
      break;

    case "CATEGORY_DELETED":
      queryClient.removeQueries({
        queryKey: roomBookmarksQueryKey(rid, categoryId),
      });
      await queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(rid),
        refetchType: "all",
      });
      break;

    default:
      break;
  }
}
