import type { QueryClient } from "@tanstack/react-query";

import type { BookmarkCategory, RoomBookmark } from "@/lib/api/rooms";
import {
  bookmarkCategoriesQueryKey,
  roomAllBookmarksQueryKey,
  roomBookmarksQueryKey,
} from "@/lib/query-keys";

export function appendBookmarkCategoryToCache(
  queryClient: QueryClient,
  roomId: string,
  category: BookmarkCategory,
): void {
  const rid = roomId.trim();
  if (!rid.length) return;

  queryClient.setQueryData<BookmarkCategory[]>(
    bookmarkCategoriesQueryKey(rid),
    (prev) => {
      if (!prev?.length) return [category];
      if (prev.some((c) => c.categoryId === category.categoryId)) {
        return prev.map((c) =>
          c.categoryId === category.categoryId ? category : c,
        );
      }
      return [...prev, category];
    },
  );
}

function mergeBookmarksById(
  prev: RoomBookmark[] | undefined,
  incoming: readonly RoomBookmark[],
): RoomBookmark[] {
  const byId = new Map<number, RoomBookmark>();
  for (const row of prev ?? []) {
    byId.set(row.bookmarkId, row);
  }
  for (const row of incoming) {
    byId.set(row.bookmarkId, row);
  }
  return [...byId.values()];
}

export function appendRoomBookmarksToCache(
  queryClient: QueryClient,
  roomId: string,
  bookmarks: readonly RoomBookmark[],
): void {
  const rid = roomId.trim();
  if (!rid.length || bookmarks.length === 0) return;

  queryClient.setQueryData<RoomBookmark[]>(
    roomAllBookmarksQueryKey(rid),
    (prev) => mergeBookmarksById(prev, bookmarks),
  );

  const byCategory = new Map<number, RoomBookmark[]>();
  for (const bookmark of bookmarks) {
    const categoryId = bookmark.categoryId;
    if (typeof categoryId !== "number" || !Number.isFinite(categoryId)) continue;
    const list = byCategory.get(categoryId) ?? [];
    list.push(bookmark);
    byCategory.set(categoryId, list);
  }

  for (const [categoryId, rows] of byCategory) {
    queryClient.setQueryData<RoomBookmark[]>(
      roomBookmarksQueryKey(rid, categoryId),
      (prev) => mergeBookmarksById(prev, rows),
    );
  }
}
