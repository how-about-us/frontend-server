import {
  defaultShouldDehydrateQuery,
  type Query,
} from "@tanstack/react-query";

// ─── React Query keys (`GET /places/photos`, 홈 카드 커버) ───────────────────

export function roomCoverPhotoNameKey(roomId: string, destination: string) {
  const d = typeof destination === "string" ? destination.trim() : "";
  return ["room-cover", "photoName", roomId, d] as const;
}

export function placePhotoUrlQueryKey(photoName: string) {
  const n = typeof photoName === "string" ? photoName.trim() : "";
  return ["places", "photoUrl", n] as const;
}

// ─── PersistQueryClient: 위 키만 localStorage 디하이드레이트 ────────────────

export const ROOM_COVER_PERSIST_STORAGE_KEY = "how-about-us-rq-room-cover";

function shouldPersistRoomCoverQuery(query: Query): boolean {
  const key = query.queryKey;
  if (!Array.isArray(key) || key.length < 1) return false;
  if (key[0] === "room-cover") return true;
  if (key[0] === "places" && key[1] === "photoUrl") return true;
  return false;
}

export function dehydrateRoomCoverOnly(query: Query): boolean {
  return (
    defaultShouldDehydrateQuery(query) && shouldPersistRoomCoverQuery(query)
  );
}
