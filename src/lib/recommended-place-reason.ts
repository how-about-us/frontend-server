/**
 * AI 장소 추천 등에서 `reason`이 `${placeId}: 본문` 형태로 올 때 본문만 반환.
 * placeId에 정규식 특수문자가 있어도 안전하게 제거합니다.
 */
export function stripRecommendedPlaceReasonPrefix(
  reason: string,
  placeId: string,
): string {
  const r = reason.trim();
  const id = placeId.trim();
  if (r.length === 0 || id.length === 0) return r;
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const stripped = r.replace(new RegExp(`^${escaped}\\s*:\\s*`), "").trim();
  return stripped.length > 0 ? stripped : r;
}
