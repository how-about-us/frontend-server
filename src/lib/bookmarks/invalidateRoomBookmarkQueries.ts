import type { Query, QueryClient } from "@tanstack/react-query";

import type { RoomBookmarkChangedEvent } from "@/types/roomBookmarkStomp";

import {
  PLACE_CARD_BOOKMARK_SEGMENT,
  bookmarkCategoriesQueryKey,
  bookmarkMapPinPlaceQueryKey,
  bookmarkMapPinPlaceRootQueryKey,
  placeCardBookmarkRootQueryKey,
  roomBookmarksQueryKey,
} from "@/lib/queryKeys/bookmarks";

function placeCardBookmarkPredicate(roomId: string, bookmarkId: number) {
  return (query: Query) => {
    const qk = query.queryKey as readonly unknown[];
    return (
      qk.length >= 4 &&
      qk[0] === PLACE_CARD_BOOKMARK_SEGMENT &&
      qk[1] === roomId &&
      qk[3] === bookmarkId
    );
  };
}

/** STOMP `RoomBookmarkChangedEvent.type`별 최소 범위 무효화·제거만 수행합니다. */
export async function invalidateRoomBookmarkQueries(
  queryClient: QueryClient,
  event: RoomBookmarkChangedEvent,
): Promise<void> {
  const rid = String(event.roomId ?? "").trim();
  if (!rid) return;

  const categoryId = event.categoryId;
  const bookmarkId = event.bookmarkId;

  switch (event.type) {
    case "BOOKMARK_CREATED":
      await queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(rid, categoryId),
        refetchType: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: bookmarkMapPinPlaceQueryKey(rid, bookmarkId),
        refetchType: "all",
      });
      break;

    case "BOOKMARK_UPDATED":
      queryClient.removeQueries({ predicate: placeCardBookmarkPredicate(rid, bookmarkId) });
      await queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(rid, categoryId),
        refetchType: "all",
      });
      await queryClient.invalidateQueries({
        queryKey: bookmarkMapPinPlaceQueryKey(rid, bookmarkId),
        refetchType: "all",
      });
      break;

    case "BOOKMARK_DELETED":
      queryClient.removeQueries({ predicate: placeCardBookmarkPredicate(rid, bookmarkId) });
      queryClient.removeQueries({
        queryKey: bookmarkMapPinPlaceQueryKey(rid, bookmarkId),
      });
      await queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(rid, categoryId),
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
      queryClient.removeQueries({
        queryKey: placeCardBookmarkRootQueryKey(rid),
      });
      queryClient.removeQueries({
        queryKey: bookmarkMapPinPlaceRootQueryKey(rid),
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
