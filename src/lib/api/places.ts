import { API_BASE } from "./config";
import { apiFetch } from "./client";
import { chunkArray, PLACE_BATCH_MAX_SIZE } from "./batch-chunk";
import { readUserFacingMessageFromApiBody } from "./errors";
import { apiUrl, jsonBody, requestJson, tryParseJson } from "./http";

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
  photoName: string | null;
};

export type PlaceSearchPageResponse = {
  items: PlaceSearchItem[];
  nextPageToken: string | null;
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

/** 사진 해상도 프리셋. 백엔드 `size` 파라미터와 1:1 매핑. 미지정/알 수 없음 → 서버가 `CARD`로 폴백. */
export type PhotoSize = "THUMB" | "CARD" | "HERO" | "GALLERY";
export const DEFAULT_PHOTO_SIZE: PhotoSize = "CARD";

/** Raw JSON from `GET /places/{googlePlaceId}/photo-names` */
export type PlacePhotoNamesResponse = {
  photoNames: string[];
};

/** Raw JSON from `GET /places/{googlePlaceId}/preview` */
export type PlacePreviewResponse = {
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  location: { latitude: number; longitude: number } | null;
  photoName: string | null;
  primaryType: string;
  primaryTypeDisplayName: string;
};

/** Client-normalized preview (coordinates match detail/search shape) */
export type PlacePreview = {
  googlePlaceId: string;
  name: string;
  formattedAddress: string;
  location?: { lat: number; lng: number };
  photoName?: string;
  primaryType?: string;
  primaryTypeDisplayName?: string;
};

// ─── Batch response types ──────────────────────────────────────────────────

export type PlacePreviewBatchItem =
  | ({
      status: "OK";
      googlePlaceId: string;
      name: string;
      formattedAddress: string;
      location: { latitude: number; longitude: number } | null;
      photoName: string | null;
      primaryType: string;
      primaryTypeDisplayName: string;
    })
  | {
      status: "ERROR";
      googlePlaceId: string;
      errorCode?: string;
    };

export type PlacePreviewBatchResponse = {
  /** 서버 명세 — `POST /places/previews/batch` */
  previews?: PlacePreviewBatchItem[];
  /** 레거시·내부 호환 */
  items?: PlacePreviewBatchItem[];
};

export type PlacePhotoNamesBatchItem =
  | {
      status: "OK";
      googlePlaceId: string;
      photoName: string;
      errorCode?: string | null;
    }
  | {
      status: "ERROR";
      googlePlaceId: string;
      errorCode?: string;
      photoName?: string | null;
    };

export type PlacePhotoNamesBatchResponse = {
  /** 서버 명세 — `POST /places/photo-names/batch` */
  photoNames?: PlacePhotoNamesBatchItem[];
  /** 레거시·내부 호환 */
  items?: PlacePhotoNamesBatchItem[];
};

export type PlacePhotoUrlBatchItem =
  | { status: "OK"; photoName: string; photoUrl: string; errorCode?: string | null }
  | { status: "ERROR"; photoName: string; errorCode?: string };

export type PlacePhotoUrlBatchResponse = {
  /** 서버 명세 — `POST /places/photos/batch` */
  photos?: PlacePhotoUrlBatchItem[];
  /** 레거시·내부 호환 */
  items?: PlacePhotoUrlBatchItem[];
};

function readBatchResponseList<T>(
  data: Record<string, unknown>,
  primaryKey: string,
): T[] {
  const primary = data[primaryKey];
  if (Array.isArray(primary)) return primary as T[];
  const legacy = data.items;
  if (Array.isArray(legacy)) return legacy as T[];
  return [];
}

// ─── API functions ─────────────────────────────────────────────────────────

export async function searchPlaces(params: {
  query: string;
  latitude: number;
  longitude: number;
  radius?: number;
  pageSize?: number;
  pageToken?: string;
}): Promise<PlaceSearchPageResponse> {
  const url = new URL(`${API_BASE}/places/search`);
  url.searchParams.set("query", params.query);
  url.searchParams.set("latitude", String(params.latitude));
  url.searchParams.set("longitude", String(params.longitude));
  if (params.radius !== undefined) {
    url.searchParams.set("radius", String(params.radius));
  }
  if (params.pageSize !== undefined) {
    url.searchParams.set("pageSize", String(params.pageSize));
  }
  if (params.pageToken) {
    url.searchParams.set("pageToken", params.pageToken);
  }

  const res = await apiFetch(url.toString());
  if (!res.ok) throw new Error(`Places search failed: ${res.status}`);
  return res.json();
}

export async function requestPlaceDetail(
  googlePlaceId: string,
): Promise<PlaceDetail> {
  const res = await apiFetch(
    `${API_BASE}/places/${encodeURIComponent(googlePlaceId)}`,
  );
  if (!res.ok) throw new Error(`Place detail failed: ${res.status}`);
  return res.json();
}

export async function requestPlacePreview(
  googlePlaceId: string,
): Promise<PlacePreviewResponse> {
  const res = await apiFetch(
    `${API_BASE}/places/${encodeURIComponent(googlePlaceId)}/preview`,
  );
  if (!res.ok) throw new Error(`Place preview failed: ${res.status}`);
  return res.json();
}

export async function requestPlacePhotoNames(
  googlePlaceId: string,
): Promise<string[]> {
  const res = await apiFetch(
    `${API_BASE}/places/${encodeURIComponent(googlePlaceId)}/photo-names`,
  );
  if (!res.ok) throw new Error(`Place photo-names failed: ${res.status}`);
  const data: PlacePhotoNamesResponse = await res.json();
  return Array.isArray(data.photoNames) ? data.photoNames : [];
}

export async function requestPlacePhotoUrl(
  photoName: string,
  size: PhotoSize = DEFAULT_PHOTO_SIZE,
): Promise<string> {
  const url = new URL(`${API_BASE}/places/photos`);
  url.searchParams.set("photoName", photoName);
  url.searchParams.set("size", size);

  const res = await apiFetch(url.toString());
  if (!res.ok) throw new Error(`Place photo failed: ${res.status}`);
  const data: PlacePhotoResponse = await res.json();
  return data.photoUrl;
}

async function requestPlacePreviewsBatchChunk(
  googlePlaceIds: string[],
): Promise<PlacePreviewBatchItem[]> {
  const data = await requestJson<PlacePreviewBatchResponse>(
    apiUrl("/places/previews/batch"),
    { method: "POST", ...jsonBody({ googlePlaceIds }) },
    { errorMessage: "장소 미리보기 일괄 조회 실패" },
  );
  return readBatchResponseList<PlacePreviewBatchItem>(data, "previews");
}

export async function requestPlacePreviewsBatch(
  googlePlaceIds: readonly string[],
): Promise<PlacePreviewBatchItem[]> {
  const ids = [
    ...new Set(
      googlePlaceIds
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter((id) => id.length > 0),
    ),
  ];
  if (!ids.length) return [];

  const chunks = chunkArray(ids, PLACE_BATCH_MAX_SIZE);
  const out: PlacePreviewBatchItem[] = [];
  for (const chunk of chunks) {
    out.push(...(await requestPlacePreviewsBatchChunk(chunk)));
  }
  return out;
}

async function requestPlacePhotoNamesBatchChunk(
  googlePlaceIds: string[],
): Promise<PlacePhotoNamesBatchItem[]> {
  const data = await requestJson<PlacePhotoNamesBatchResponse>(
    apiUrl("/places/photo-names/batch"),
    { method: "POST", ...jsonBody({ googlePlaceIds }) },
    { errorMessage: "장소 사진 이름 일괄 조회 실패" },
  );
  return readBatchResponseList<PlacePhotoNamesBatchItem>(data, "photoNames");
}

export async function requestPlacePhotoNamesBatch(
  googlePlaceIds: readonly string[],
): Promise<PlacePhotoNamesBatchItem[]> {
  const ids = [
    ...new Set(
      googlePlaceIds
        .map((id) => (typeof id === "string" ? id.trim() : ""))
        .filter((id) => id.length > 0),
    ),
  ];
  if (!ids.length) return [];

  const chunks = chunkArray(ids, PLACE_BATCH_MAX_SIZE);
  const out: PlacePhotoNamesBatchItem[] = [];
  for (const chunk of chunks) {
    out.push(...(await requestPlacePhotoNamesBatchChunk(chunk)));
  }
  return out;
}

async function requestPlacePhotoUrlsBatchChunk(
  photoNames: string[],
  size: PhotoSize,
): Promise<PlacePhotoUrlBatchItem[]> {
  const res = await apiFetch(apiUrl("/places/photos/batch"), {
    method: "POST",
    ...jsonBody({ photoNames, size }),
  });
  if (res.status === 204) return [];
  if (!res.ok) {
    const body = await tryParseJson(res);
    const detail = readUserFacingMessageFromApiBody(body);
    throw new Error(detail ?? `장소 사진 URL 일괄 조회 실패: ${res.status}`);
  }
  const data = (await res.json()) as PlacePhotoUrlBatchResponse;
  return readBatchResponseList<PlacePhotoUrlBatchItem>(data, "photos");
}

export async function requestPlacePhotoUrlsBatch(
  photoNames: readonly string[],
  size: PhotoSize = DEFAULT_PHOTO_SIZE,
): Promise<PlacePhotoUrlBatchItem[]> {
  const names = [
    ...new Set(
      photoNames
        .map((n) => (typeof n === "string" ? n.trim() : ""))
        .filter((n) => n.length > 0),
    ),
  ];
  if (!names.length) return [];

  const chunks = chunkArray(names, PLACE_BATCH_MAX_SIZE);
  const out: PlacePhotoUrlBatchItem[] = [];
  for (const chunk of chunks) {
    out.push(...(await requestPlacePhotoUrlsBatchChunk(chunk, size)));
  }
  return out;
}
