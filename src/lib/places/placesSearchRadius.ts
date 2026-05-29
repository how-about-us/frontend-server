/** `GET /places/search` radius 상한 — 서버 `@DecimalMax(50000)` */
export const PLACES_SEARCH_MAX_RADIUS_METERS = 50_000;

/** Places 텍스트 검색·지도 스냅샷 반경(m) — 1 ~ 50_000 */
export function clampPlacesSearchRadiusMeters(radius: number): number {
  if (!Number.isFinite(radius)) return PLACES_SEARCH_MAX_RADIUS_METERS;
  return Math.min(
    PLACES_SEARCH_MAX_RADIUS_METERS,
    Math.max(1, Math.round(radius)),
  );
}
