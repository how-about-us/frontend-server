const BOOKMARK_CATEGORIES = "bookmark-categories" as const;
const ROOM_BOOKMARKS = "room-bookmarks" as const;
const PLACE_CARD_BOOKMARK = "place-card-bookmark" as const;

export function bookmarkCategoriesQueryKey(roomId: string | null) {
  return [BOOKMARK_CATEGORIES, roomId] as const;
}

export function roomBookmarksQueryKey(
  roomId: string | null,
  categoryId: number | null,
) {
  return [ROOM_BOOKMARKS, roomId, categoryId] as const;
}

/** 해당 방의 모든 카테고리별 북마크 목록 쿼리에 공통 접두 */
export function roomBookmarksByRoomRootQueryKey(roomId: string) {
  return [ROOM_BOOKMARKS, roomId] as const;
}

/** 해당 방 아래 장소 카드(place detail) 미리보기 쿼리 제거용 접두 */
export function placeCardBookmarkRootQueryKey(roomId: string) {
  return [PLACE_CARD_BOOKMARK, roomId] as const;
}

export function placeCardBookmarkQueryKey(
  roomId: string,
  googlePlaceId: string,
  bookmarkId: number,
) {
  return [PLACE_CARD_BOOKMARK, roomId, googlePlaceId, bookmarkId] as const;
}
