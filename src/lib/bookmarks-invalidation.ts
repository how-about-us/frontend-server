import type { QueryClient } from "@tanstack/react-query";

import {
  bookmarkCategoriesQueryKey,
  roomAllBookmarksQueryKey,
  roomBookmarksByRoomRootQueryKey,
  roomBookmarksQueryKey,
} from "@/lib/query-keys";
import type { RoomBookmarkChangedEvent } from "@/types/roomBookmarkStomp";

async function invalidateAllRoomBookmarkQueries(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: roomAllBookmarksQueryKey(roomId),
    refetchType: "active",
  });
  await queryClient.invalidateQueries({
    queryKey: roomBookmarksByRoomRootQueryKey(roomId),
    refetchType: "active",
  });
}

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
        refetchType: "active",
      });
      await invalidateAllRoomBookmarkQueries(queryClient, rid);
      await queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(rid),
        refetchType: "active",
      });
      break;

    case "BOOKMARK_UPDATED":
      await queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(rid, categoryId),
        refetchType: "active",
      });
      await invalidateAllRoomBookmarkQueries(queryClient, rid);
      await queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(rid),
        refetchType: "active",
      });
      break;

    case "BOOKMARK_DELETED":
      await queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(rid, categoryId),
        refetchType: "active",
      });
      await invalidateAllRoomBookmarkQueries(queryClient, rid);
      await queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(rid),
        refetchType: "active",
      });
      break;

    case "CATEGORY_CREATED":
    case "CATEGORY_UPDATED":
      await queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(rid),
        refetchType: "active",
      });
      break;

    case "CATEGORY_DELETED":
      queryClient.removeQueries({
        queryKey: roomBookmarksQueryKey(rid, categoryId),
      });
      await invalidateAllRoomBookmarkQueries(queryClient, rid);
      await queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(rid),
        refetchType: "active",
      });
      break;

    default:
      break;
  }
}
