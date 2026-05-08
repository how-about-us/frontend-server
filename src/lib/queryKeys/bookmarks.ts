export const BOOKMARK_CATEGORIES_SEGMENT = "bookmark-categories" as const;
export const ROOM_BOOKMARKS_SEGMENT = "room-bookmarks" as const;
export const PLACE_CARD_BOOKMARK_SEGMENT = "place-card-bookmark" as const;
export const BOOKMARK_MAP_PIN_PLACE_SEGMENT = "bookmark-map-pin-place" as const;

const BOOKMARK_CATEGORIES = BOOKMARK_CATEGORIES_SEGMENT;
const ROOM_BOOKMARKS = ROOM_BOOKMARKS_SEGMENT;
const PLACE_CARD_BOOKMARK = PLACE_CARD_BOOKMARK_SEGMENT;
const BOOKMARK_MAP_PIN_PLACE = BOOKMARK_MAP_PIN_PLACE_SEGMENT;

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

/** 맵 핀 좌표/요약 전용 `/places/:id`(getPlaceDetail) 캐시 — 폴더 카드 쿼리와 분리 */
export function bookmarkMapPinPlaceRootQueryKey(roomId: string) {
  return [BOOKMARK_MAP_PIN_PLACE, roomId] as const;
}

export function bookmarkMapPinPlaceQueryKey(roomId: string, bookmarkId: number) {
  return [BOOKMARK_MAP_PIN_PLACE, roomId, bookmarkId] as const;
}
