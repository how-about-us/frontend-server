import type { SearchResultCardProps } from "@/types/place";

import {
  requestPlaceDetail,
  requestPlacePhotoUrl,
  type PlaceDetail,
} from "@/lib/api/places";
import { getQueryClient } from "@/lib/query-client";
import {
  placePhotoUrlQueryDefaults,
  placePhotoUrlQueryKey,
} from "@/lib/place-photo-query";

export const placeDetailQueryDefaults = {
  staleTime: 60_000,
  refetchOnWindowFocus: false,
} as const;

export function placeDetailQueryKey(googlePlaceId: string) {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  return ["places", "detail", id] as const;
}

export async function fetchPlaceDetail(googlePlaceId: string): Promise<PlaceDetail> {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  if (!id.length) {
    throw new Error("fetchPlaceDetail: empty googlePlaceId");
  }

  const queryClient = getQueryClient();
  if (!queryClient) {
    return requestPlaceDetail(id);
  }

  return queryClient.fetchQuery({
    queryKey: placeDetailQueryKey(id),
    queryFn: () => requestPlaceDetail(id),
    ...placeDetailQueryDefaults,
  });
}

export async function fetchPlacePhotoUrl(photoName: string): Promise<string> {
  const name = typeof photoName === "string" ? photoName.trim() : "";
  if (!name.length) {
    throw new Error("fetchPlacePhotoUrl: empty photoName");
  }

  const queryClient = getQueryClient();
  if (!queryClient) {
    return requestPlacePhotoUrl(name);
  }

  return queryClient.fetchQuery({
    queryKey: placePhotoUrlQueryKey(name),
    queryFn: () => requestPlacePhotoUrl(name),
    ...placePhotoUrlQueryDefaults,
  });
}

/** Loads place detail and first photo for list/search card display (e.g. bookmarks). */
export async function fetchPlaceCardProps(
  googlePlaceId: string,
): Promise<SearchResultCardProps> {
  const detail = await fetchPlaceDetail(googlePlaceId);
  let image: string | undefined;
  const firstPhoto = detail.photoNames[0];
  if (firstPhoto) {
    try {
      image = await fetchPlacePhotoUrl(firstPhoto);
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
