import { getPlaceDetail } from "@/lib/api/places";

/** `getPlaceDetail` 한 번으로 OG·AI 카드용 사진·평점·리뷰 수 */
export type PlaceCardEnrichmentFromDetail = {
  photoName: string | null;
  rating: number | null;
  userRatingCount: number | null;
};

export async function resolvePlaceCardEnrichmentFromPlaceId(
  googlePlaceId: string,
): Promise<PlaceCardEnrichmentFromDetail | null> {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  if (!id) return null;
  try {
    const detail = await getPlaceDetail(id);
    const first = detail.photoNames?.[0]?.trim() ?? "";
    return {
      photoName: first.length > 0 ? first : null,
      rating:
        typeof detail.rating === "number" && Number.isFinite(detail.rating) ?
          detail.rating
        : null,
      userRatingCount:
        typeof detail.userRatingCount === "number" &&
        Number.isFinite(detail.userRatingCount) ?
          detail.userRatingCount
        : null,
    };
  } catch {
    return null;
  }
}

/** Autocomplete/룸 목적지: place 상세에서 첫 사진 리소스 이름 */
export async function resolveCoverPhotoNameFromPlaceId(
  googlePlaceId: string,
): Promise<string | null> {
  const enriched = await resolvePlaceCardEnrichmentFromPlaceId(googlePlaceId);
  return enriched?.photoName ?? null;
}
