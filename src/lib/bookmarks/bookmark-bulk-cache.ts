import type { QueryClient } from "@tanstack/react-query";

import { getAllRoomBookmarks } from "@/lib/api/rooms/bookmarks";
import type { RoomBookmark } from "@/lib/api/rooms/types";
import {
  roomAllBookmarksQueryKey,
  roomBookmarksQueryKey,
} from "@/lib/query-keys";

export function seedRoomBookmarksByCategory(
  queryClient: QueryClient,
  roomId: string,
  allBookmarks: readonly RoomBookmark[],
): void {
  const rid = roomId.trim();
  if (!rid.length) return;

  const byCategory = new Map<number, RoomBookmark[]>();
  for (const bookmark of allBookmarks) {
    const categoryId = bookmark.categoryId;
    if (typeof categoryId !== "number" || !Number.isFinite(categoryId)) continue;
    const list = byCategory.get(categoryId) ?? [];
    list.push(bookmark);
    byCategory.set(categoryId, list);
  }

  for (const [categoryId, bookmarks] of byCategory) {
    queryClient.setQueryData(
      roomBookmarksQueryKey(rid, categoryId),
      bookmarks,
    );
  }
}

export async function fetchAndSeedAllRoomBookmarks(
  queryClient: QueryClient,
  roomId: string,
): Promise<RoomBookmark[]> {
  const rid = roomId.trim();
  if (!rid.length) return [];

  const bookmarks = await getAllRoomBookmarks(rid);
  queryClient.setQueryData(roomAllBookmarksQueryKey(rid), bookmarks);
  seedRoomBookmarksByCategory(queryClient, rid, bookmarks);
  return bookmarks;
}
