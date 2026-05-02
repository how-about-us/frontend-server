import { apiFetch } from "@/lib/api/client";
import { HttpError, isRoomBookmarkDuplicateFromBody } from "@/lib/api/errors";
import { apiUrl, jsonBody, requestJson, requestVoid, tryParseJson } from "@/lib/api/http";
import type {
  RoomBookmark,
  RoomBookmarkCategoryPatchRequest,
  RoomBookmarkCreateRequest,
} from "./types";

export async function getRoomBookmarks(
  roomId: string,
  categoryId: number,
): Promise<RoomBookmark[]> {
  const url = new URL(apiUrl(`/rooms/${roomId}/bookmarks`));
  url.searchParams.set("categoryId", String(categoryId));
  return requestJson(url.toString(), undefined, {
    errorMessage: "보관함 목록 조회 실패",
  });
}

export async function createRoomBookmark(
  roomId: string,
  body: RoomBookmarkCreateRequest,
): Promise<RoomBookmark> {
  const res = await apiFetch(apiUrl(`/rooms/${roomId}/bookmarks`), {
    method: "POST",
    ...jsonBody(body),
  });

  const parsed = await tryParseJson(res);

  if (!res.ok) {
    if (isRoomBookmarkDuplicateFromBody(parsed)) {
      throw new HttpError(409, "이미 북마크에 추가된 장소입니다");
    }
    const msg =
      parsed !== null &&
      typeof parsed === "object" &&
      "message" in parsed &&
      typeof (parsed as { message: unknown }).message === "string"
        ? (parsed as { message: string }).message
        : `보관함 항목 추가 실패: ${res.status}`;
    throw new Error(msg);
  }

  return parsed as RoomBookmark;
}

export async function patchRoomBookmarkCategory(
  roomId: string,
  bookmarkId: number,
  body: RoomBookmarkCategoryPatchRequest,
): Promise<RoomBookmark> {
  return requestJson(
    apiUrl(`/rooms/${roomId}/bookmarks/${bookmarkId}/category`),
    { method: "PATCH", ...jsonBody(body) },
    { errorMessage: "보관함 카테고리 변경 실패" },
  );
}

export async function deleteRoomBookmark(
  roomId: string,
  bookmarkId: number,
): Promise<void> {
  return requestVoid(
    apiUrl(`/rooms/${roomId}/bookmarks/${bookmarkId}`),
    { method: "DELETE" },
    { errorMessage: "보관함 항목 삭제 실패" },
  );
}
