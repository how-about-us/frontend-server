/** One saved place in a folder (preview card fields + server bookmark row id). */
export type BookmarkedPlace = {
  id: string;
  name: string;
  address: string;
  /** `GET /places/photos` — 카드에서 별도 로드 */
  photoName?: string;
  googlePlaceId: string;
  location?: { lat: number; lng: number };
};

/** Bookmark category as shown in the folder list / detail header (from API categories). */
export type BookmarkFolder = {
  id: string;
  title: string;
  /** Ribbon color (hex) */
  color: string;
  placeCount?: number;
};
