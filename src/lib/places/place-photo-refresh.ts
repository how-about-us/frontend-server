import type { QueryClient } from "@tanstack/react-query";

import { requestPlacePhotoUrl } from "@/lib/api/places";
import { logPlacePhotoImageError } from "@/lib/debug/photo-url-events";
import { placePhotoUrlQueryKey } from "@/lib/place-photo-query";
import { getQueryClient } from "@/lib/query-client";

const inFlightRefreshByPlaceId = new Map<string, Promise<string>>();

export async function refreshPlacePhotoUrl(
  googlePlaceId: string,
  queryClient?: QueryClient | null,
): Promise<string> {
  const id = typeof googlePlaceId === "string" ? googlePlaceId.trim() : "";
  if (!id.length) return "";

  const existing = inFlightRefreshByPlaceId.get(id);
  if (existing) return existing;

  const refreshPromise = (async () => {
    try {
      const freshUrl = await requestPlacePhotoUrl(id, { refresh: true });
      const trimmed = typeof freshUrl === "string" ? freshUrl.trim() : "";
      if (trimmed.length > 0) {
        const qc = queryClient ?? getQueryClient();
        qc?.setQueryData(placePhotoUrlQueryKey(id), trimmed, {
          updatedAt: Date.now(),
        });
      }
      return trimmed;
    } finally {
      inFlightRefreshByPlaceId.delete(id);
    }
  })();

  inFlightRefreshByPlaceId.set(id, refreshPromise);
  return refreshPromise;
}

export function handlePlacePhotoImageError(args: {
  source: string;
  googlePlaceId?: string | null;
  placeName?: string | null;
  image: HTMLImageElement;
}): void {
  logPlacePhotoImageError(args);

  const id =
    typeof args.googlePlaceId === "string" ? args.googlePlaceId.trim() : "";
  if (!id.length) return;
  if (args.image.dataset.photoRefreshAttempted === "true") return;

  args.image.dataset.photoRefreshAttempted = "true";
  void refreshPlacePhotoUrl(id)
    .then((freshUrl) => {
      if (freshUrl && args.image.isConnected) {
        args.image.src = freshUrl;
      }
    })
    .catch((error: unknown) => {
      console.warn("[PHOTO-URL] refresh failed", {
        source: args.source,
        googlePlaceId: id,
        placeName: args.placeName ?? null,
        error,
      });
    });
}
