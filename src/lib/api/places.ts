import type { SearchResultCardProps } from "@/components/place/SearchResultCard";
import { apiFetch } from "./client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// ─── Response types ────────────────────────────────────────────────────────

export type PlaceSearchItem = {
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  primaryType: string;
  primaryTypeDisplayName: string;
  rating: number;
  userRatingCount: number;
  openNow: boolean;
  photoName: string;
};

export type PlaceReview = {
  rating: number;
  text: string;
  authorDisplayName: string;
  publishTime: string;
  relativePublishTimeDescription: string;
};

export type PlaceDetail = {
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
  primaryType: string;
  primaryTypeDisplayName: string;
  rating: number | null;
  userRatingCount: number | null;
  phoneNumber: string;
  websiteUri: string;
  googleMapsUri: string;
  regularOpeningHours: {
    openNow: boolean;
    weekdayDescriptions: string[];
    nextOpenTime?: string;
    nextCloseTime?: string;
  } | null;
  photoNames: string[];
  reviewSummary: string | null;
  reviews: PlaceReview[];
};

export type PlacePhotoResponse = {
  photoUrl: string;
};

// ─── API functions ─────────────────────────────────────────────────────────

export async function searchPlaces(params: {
  query: string;
  latitude: number;
  longitude: number;
  radius?: number;
}): Promise<PlaceSearchItem[]> {
  const url = new URL(`${API_BASE}/places/search`);
  url.searchParams.set("query", params.query);
  url.searchParams.set("latitude", String(params.latitude));
  url.searchParams.set("longitude", String(params.longitude));
  if (params.radius !== undefined) {
    url.searchParams.set("radius", String(params.radius));
  }

  const res = await apiFetch(url.toString());
  if (!res.ok) throw new Error(`Places search failed: ${res.status}`);
  return res.json();
}

export async function getPlaceDetail(
  googlePlaceId: string,
): Promise<PlaceDetail> {
  const res = await apiFetch(
    `${API_BASE}/places/${encodeURIComponent(googlePlaceId)}`,
  );
  if (!res.ok) throw new Error(`Place detail failed: ${res.status}`);
  return res.json();
}

export async function getPlacePhotoUrl(photoName: string): Promise<string> {
  const url = new URL(`${API_BASE}/places/photos`);
  url.searchParams.set("photoName", photoName);

  const res = await apiFetch(url.toString());
  if (!res.ok) throw new Error(`Place photo failed: ${res.status}`);
  const data: PlacePhotoResponse = await res.json();
  return data.photoUrl;
}

/** Loads place detail and first photo for list/search card display (e.g. bookmarks). */
export async function getPlaceCardPropsByGoogleId(
  googlePlaceId: string,
): Promise<SearchResultCardProps> {
  const detail = await getPlaceDetail(googlePlaceId);
  let image: string | undefined;
  const firstPhoto = detail.photoNames[0];
  if (firstPhoto) {
    try {
      image = await getPlacePhotoUrl(firstPhoto);
    } catch {
      /* preview optional */
    }
  }
  const hours = detail.regularOpeningHours?.weekdayDescriptions?.length
    ? detail.regularOpeningHours.weekdayDescriptions.join("\n")
    : undefined;
  return {
    name: detail.name,
    category: detail.primaryTypeDisplayName || detail.primaryType,
    rating: detail.rating,
    userRatingCount: detail.userRatingCount,
    isOpen: detail.regularOpeningHours?.openNow ?? null,
    address: detail.formattedAddress,
    googlePlaceId: detail.googlePlaceId,
    location: detail.location,
    reviewSummary: detail.reviewSummary,
    image,
    phone: detail.phoneNumber || undefined,
    hours,
    website: detail.websiteUri || undefined,
  };
}
