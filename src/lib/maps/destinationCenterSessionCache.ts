const STORAGE_KEY = "hau:destination-center-v1";

type Payload = Record<
  string,
  { lat: number; lng: number; destination: string }
>;

function loadAll(): Payload {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return {};
    return parsed as Payload;
  } catch {
    return {};
  }
}

function saveAll(payload: Payload): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / privacy mode */
  }
}

function cacheKey(roomId: string): string {
  return roomId.trim();
}

/** 방 + 목적지 문자열 단위로 한 번 찍은 지오코드를 세션 동안 재사용 (새로고침 깜빡임 완화) */
export function readDestinationLatLngFromSession(
  roomId: string,
  destination: string,
): google.maps.LatLngLiteral | null {
  const rid = cacheKey(roomId);
  const d = destination.trim();
  if (!rid.length || !d.length) return null;
  const entry = loadAll()[rid];
  if (!entry || entry.destination !== d) return null;
  const { lat, lng } = entry;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function writeDestinationLatLngToSession(
  roomId: string,
  destination: string,
  coords: google.maps.LatLngLiteral,
): void {
  const rid = cacheKey(roomId);
  const d = destination.trim();
  if (!rid.length || !d.length) return;
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return;
  const all = loadAll();
  all[rid] = { lat: coords.lat, lng: coords.lng, destination: d };
  saveAll(all);
}
