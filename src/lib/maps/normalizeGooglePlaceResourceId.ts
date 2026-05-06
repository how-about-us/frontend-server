/** Google Places 리소스 id(`places/…`) 접두를 제거한 레거시 id */
export function normalizeGooglePlaceResourceId(id: string): string {
  const prefix = "places/";
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}
