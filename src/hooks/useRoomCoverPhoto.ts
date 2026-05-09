import { useQuery } from "@tanstack/react-query";

import { getPlacePhotoUrl, searchPlaces } from "@/lib/api/places";
import type { RoomListItem } from "@/lib/api/rooms";
import {
  placePhotoUrlQueryKey,
  roomCoverPhotoNameKey,
} from "@/lib/room-cover-query";
import { placePhotoUrlQueryDefaults } from "@/lib/place-photo-query";

const DEFAULT_SEARCH_CENTER = { lat: 37.5665, lng: 126.978 };

const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 300_000,
  timeout: 4_000,
};

async function resolveRoughSearchCoords(): Promise<{
  lat: number;
  lng: number;
}> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return DEFAULT_SEARCH_CENTER;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => resolve(DEFAULT_SEARCH_CENTER),
      GEO_OPTIONS,
    );
  });
}

export function usePlacePhotoUrlQuery(photoName: string | null | undefined) {
  const name = typeof photoName === "string" ? photoName.trim() : "";
  return useQuery({
    queryKey: placePhotoUrlQueryKey(name),
    queryFn: () => getPlacePhotoUrl(name),
    enabled: name.length > 0,
    ...placePhotoUrlQueryDefaults,
  });
}

/**
 * 룸 목적지 커버용 `photoName`. `setQueryData`로 시드되면 재요청하지 않음.
 * 시드 없으면 `destination` + 대략 좌표로 `searchPlaces` 폴백.
 */
export function useRoomCoverPhotoName(room: RoomListItem) {
  const id = typeof room.id === "string" ? room.id.trim() : "";
  const dest =
    typeof room.destination === "string" ? room.destination.trim() : "";

  return useQuery({
    queryKey: roomCoverPhotoNameKey(id, dest),
    queryFn: async () => {
      const coords = await resolveRoughSearchCoords();
      const items = await searchPlaces({
        query: dest,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      const raw = items[0]?.photoName?.trim() ?? "";
      return raw.length > 0 ? raw : null;
    },
    enabled: id.length > 0 && dest.length > 0,
    ...placePhotoUrlQueryDefaults,
  });
}

/** placeId 없을 때 제출용: 검색 첫 결과의 photoName */
export async function resolveCoverPhotoNameFromSearch(
  destination: string,
): Promise<string | null> {
  const q = typeof destination === "string" ? destination.trim() : "";
  if (!q) return null;
  const coords = await resolveRoughSearchCoords();
  const items = await searchPlaces({
    query: q,
    latitude: coords.lat,
    longitude: coords.lng,
  });
  const raw = items[0]?.photoName?.trim() ?? "";
  return raw.length > 0 ? raw : null;
}
