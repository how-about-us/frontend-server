import type { ScheduleTravelModeValue } from "@/lib/plan/scheduleTravelMode";

// ─── Bookmarks ───────────────────────────────────────────────────────────────

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

export function bookmarkMapPinPlaceQueryKey(
  roomId: string,
  bookmarkId: number,
) {
  return [BOOKMARK_MAP_PIN_PLACE, roomId, bookmarkId] as const;
}

const AI_RECOMMENDED_PLACE_ENRICHMENT_SEGMENT =
  "ai-recommended-place-enrichment" as const;

/** AI 장소 추천 카드 — 메타 결손 시 `resolvePlaceCardEnrichmentFromPlaceId` 쿼리 */
export function aiRecommendedPlaceEnrichmentQueryKey(googlePlaceId: string) {
  const id =
    typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return [AI_RECOMMENDED_PLACE_ENRICHMENT_SEGMENT, id] as const;
}

// ─── Plan itinerary map path (per segment, Google Directions JS) ─────────────

const PLAN_ITINERARY_MAP_PATH_CACHE_VERSION = "orient-v1" as const;

export function planItinerarySegmentMapPathQueryKey(
  rid: string,
  scheduleId: number,
  segmentSourceItemId: number,
  originPlaceId: string,
  destPlaceId: string,
  travelModeCanon: string,
  roomDirectionsEpoch: number,
  segmentEpoch: number,
) {
  return [
    "plan-itinerary-map-segment-path",
    PLAN_ITINERARY_MAP_PATH_CACHE_VERSION,
    rid,
    scheduleId,
    segmentSourceItemId,
    originPlaceId.trim(),
    destPlaceId.trim(),
    travelModeCanon,
    roomDirectionsEpoch,
    segmentEpoch,
  ] as const;
}

// ─── Room schedules ──────────────────────────────────────────────────────────

export const roomSchedulesQueryKey = (roomId: string | null) =>
  ["room-schedules", roomId] as const;

// ─── Rooms / members ─────────────────────────────────────────────────────────

export const ROOMS_QUERY_KEY = ["rooms"] as const;

export function roomDetailQueryKey(roomId: string) {
  return ["room-detail", roomId] as const;
}

export function roomMembersQueryKey(roomId: string | null) {
  return ["room-members", roomId] as const;
}

export function joinRequestsQueryKey(roomId: string | null) {
  return ["join-requests", roomId] as const;
}

// ─── Schedule items / routes ─────────────────────────────────────────────────

export const scheduleItemsQueryKey = (
  roomId: string | null,
  scheduleId: number | null,
) => ["schedule-items", roomId, scheduleId, "v2-loc"] as const;

/**
 * 구간별 길찾기 API 결과 (`GET …/route?travelMode=…`).
 * 무효화: `["schedule-item-route", roomId]` prefix.
 */
export const scheduleItemRouteQueryKey = (
  roomId: string | null,
  scheduleId: number | null,
  segmentSourceItemId: number | null,
  travelMode: ScheduleTravelModeValue | null,
) =>
  [
    "schedule-item-route",
    roomId,
    scheduleId,
    segmentSourceItemId,
    travelMode,
  ] as const;
