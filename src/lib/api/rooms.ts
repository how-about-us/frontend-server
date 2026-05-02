import { apiFetch } from "./client";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// ─── Request / Response types ───────────────────────────────────────────────

export type RoomCreateRequest = {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
};

export type RoomCreateResponse = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  inviteCode: string;
  memberCount: number;
  role: string;
  createdAt: string;
};

export type RoomListItem = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  role: string;
  joinedAt: string;
};

export type RoomListResponse = {
  rooms: RoomListItem[];
  nextCursor: string | null;
  hasNext: boolean;
};

// ─── API functions ──────────────────────────────────────────────────────────

export async function createRoom(
  data: RoomCreateRequest,
): Promise<RoomCreateResponse> {
  const res = await apiFetch(`${API_BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`방 생성 실패: ${res.status}`);
  return res.json();
}

export async function getRooms(params?: {
  cursor?: string;
  size?: number;
}): Promise<RoomListResponse> {
  const url = new URL(`${API_BASE}/rooms`);
  if (params?.cursor) url.searchParams.set("cursor", params.cursor);
  if (params?.size !== undefined)
    url.searchParams.set("size", String(params.size));

  const res = await apiFetch(url.toString());
  if (!res.ok) throw new Error(`방 목록 조회 실패: ${res.status}`);
  return res.json();
}

export type RoomUpdateRequest = {
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
};

export type RoomDetail = {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  inviteCode: string;
  memberCount: number;
  role: string;
  createdAt: string;
};

export type JoinRoomResponse = {
  status: string;
  id: string;
  roomTitle: string;
  role: string;
};

export type RoomMember = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  role: "HOST" | "MEMBER";
  joinedAt: string;
};

export type RoomMemberListResponse = {
  members: RoomMember[];
};

export type JoinRequest = {
  requestId: number;
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  requestedAt: string;
};

export type JoinRequestListResponse = {
  requests: JoinRequest[];
};

export async function getRoomDetail(roomId: string): Promise<RoomDetail> {
  const res = await apiFetch(`${API_BASE}/rooms/${roomId}`);
  if (!res.ok) throw new Error(`방 상세 조회 실패: ${res.status}`);
  return res.json();
}

export async function updateRoom(
  roomId: string,
  data: RoomUpdateRequest,
): Promise<RoomCreateResponse> {
  const res = await apiFetch(`${API_BASE}/rooms/${roomId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`방 수정 실패: ${res.status}`);
  return res.json();
}

export async function deleteRoom(roomId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/rooms/${roomId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`방 삭제 실패: ${res.status}`);
}

export async function regenerateInviteCode(
  roomId: string,
): Promise<{ inviteCode: string }> {
  const res = await apiFetch(`${API_BASE}/rooms/${roomId}/invite-code`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`초대 코드 재발급 실패: ${res.status}`);
  return res.json();
}

export async function getRoomMembers(
  roomId: string,
): Promise<RoomMemberListResponse> {
  const res = await apiFetch(`${API_BASE}/rooms/${roomId}/members`);
  if (!res.ok) throw new Error(`멤버 목록 조회 실패: ${res.status}`);
  return res.json();
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function getJoinStatus(roomId: string): Promise<JoinRoomResponse> {
  const res = await apiFetch(`${API_BASE}/rooms/${roomId}/join/status`);
  if (!res.ok)
    throw new HttpError(res.status, `입장 상태 조회 실패: ${res.status}`);
  return res.json();
}

export async function joinRoom(inviteCode: string): Promise<JoinRoomResponse> {
  const res = await apiFetch(`${API_BASE}/rooms/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inviteCode }),
  });
  if (!res.ok) throw new Error(`입장 요청 실패: ${res.status}`);
  return res.json();
}

export async function getJoinRequests(
  roomId: string,
): Promise<JoinRequestListResponse> {
  const res = await apiFetch(`${API_BASE}/rooms/${roomId}/join-requests`);
  if (!res.ok) throw new Error(`입장 요청 목록 조회 실패: ${res.status}`);
  return res.json();
}

export async function transferHost(
  roomId: string,
  targetUserId: number,
): Promise<void> {
  const res = await apiFetch(`${API_BASE}/rooms/${roomId}/host`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  });
  if (!res.ok) throw new HttpError(res.status, `방장 위임 실패: ${res.status}`);
}

export async function leaveRoom(roomId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/rooms/${roomId}/members/me`, {
    method: "DELETE",
  });
  if (!res.ok) throw new HttpError(res.status, `방 나가기 실패: ${res.status}`);
}

export async function kickMember(
  roomId: string,
  userId: number,
): Promise<void> {
  const res = await apiFetch(`${API_BASE}/rooms/${roomId}/members/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new HttpError(res.status, `멤버 추방 실패: ${res.status}`);
}

export type RoomMessage = {
  id: string;
  roomId: string;
  senderId: number;
  messageType: "CHAT" | "AI";
  content: string;
  metadata?: Record<string, string>;
  createdAt: string;
};

export async function getRoomMessages(
  roomId: string,
  params?: { afterId?: string; size?: number },
): Promise<RoomMessage[]> {
  const url = new URL(`${API_BASE}/rooms/${roomId}/messages`);
  if (params?.afterId) url.searchParams.set("afterId", params.afterId);
  if (params?.size !== undefined)
    url.searchParams.set("size", String(params.size));

  const res = await apiFetch(url.toString());
  if (!res.ok) throw new Error(`메시지 목록 조회 실패: ${res.status}`);
  return res.json();
}

export async function approveJoinRequest(
  roomId: string,
  requestId: number,
): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/rooms/${roomId}/join-requests/${requestId}/approve`,
    {  method: "POST" },
  );
  if (!res.ok) throw new Error(`입장 승인 실패: ${res.status}`);
}

export async function rejectJoinRequest(
  roomId: string,
  requestId: number,
): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/rooms/${roomId}/join-requests/${requestId}/reject`,
    {  method: "POST" },
  );
  if (!res.ok) throw new Error(`입장 거절 실패: ${res.status}`);
}

// ─── Bookmark categories ───────────────────────────────────────────────────

export type BookmarkCategory = {
  categoryId: number;
  roomId: string;
  name: string;
  colorCode: string;
  createdBy: number;
  createdAt: string;
  placeCount: number;
};

export type BookmarkCategoryCreateRequest = {
  name: string;
  colorCode: string;
};

export type BookmarkCategoryUpdateRequest = {
  name: string;
  colorCode: string;
};

export async function getBookmarkCategories(
  roomId: string,
): Promise<BookmarkCategory[]> {
  const res = await apiFetch(
    `${API_BASE}/rooms/${roomId}/bookmark-categories`,
  );
  if (!res.ok) throw new Error(`보관함 카테고리 조회 실패: ${res.status}`);
  return res.json();
}

export async function createBookmarkCategory(
  roomId: string,
  body: BookmarkCategoryCreateRequest,
): Promise<BookmarkCategory> {
  const res = await apiFetch(
    `${API_BASE}/rooms/${roomId}/bookmark-categories`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`보관함 카테고리 생성 실패: ${res.status}`);
  return res.json();
}

export async function updateBookmarkCategory(
  roomId: string,
  categoryId: number,
  body: BookmarkCategoryUpdateRequest,
): Promise<BookmarkCategory> {
  const res = await apiFetch(
    `${API_BASE}/rooms/${roomId}/bookmark-categories/${categoryId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`보관함 카테고리 수정 실패: ${res.status}`);
  return res.json();
}

export async function deleteBookmarkCategory(
  roomId: string,
  categoryId: number,
): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/rooms/${roomId}/bookmark-categories/${categoryId}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(`보관함 카테고리 삭제 실패: ${res.status}`);
}

// ─── Room bookmarks (places in categories) ─────────────────────────────────

export type RoomBookmark = {
  bookmarkId: number;
  roomId: string;
  googlePlaceId: string;
  categoryId: number;
  category: string;
  addedBy: number;
  createdAt: string;
};

export type RoomBookmarkCreateRequest = {
  googlePlaceId: string;
  categoryId: number;
};

export async function getRoomBookmarks(
  roomId: string,
  categoryId: number,
): Promise<RoomBookmark[]> {
  const url = new URL(`${API_BASE}/rooms/${roomId}/bookmarks`);
  url.searchParams.set("categoryId", String(categoryId));
  const res = await apiFetch(url.toString());
  if (!res.ok) throw new Error(`보관함 목록 조회 실패: ${res.status}`);
  return res.json();
}

export async function createRoomBookmark(
  roomId: string,
  body: RoomBookmarkCreateRequest,
): Promise<RoomBookmark> {
  const res = await apiFetch(`${API_BASE}/rooms/${roomId}/bookmarks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`보관함 항목 추가 실패: ${res.status}`);
  return res.json();
}

export type RoomBookmarkCategoryPatchRequest = {
  categoryId: number;
};

export async function patchRoomBookmarkCategory(
  roomId: string,
  bookmarkId: number,
  body: RoomBookmarkCategoryPatchRequest,
): Promise<RoomBookmark> {
  const res = await apiFetch(
    `${API_BASE}/rooms/${roomId}/bookmarks/${bookmarkId}/category`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) throw new Error(`보관함 카테고리 변경 실패: ${res.status}`);
  return res.json();
}

export async function deleteRoomBookmark(
  roomId: string,
  bookmarkId: number,
): Promise<void> {
  const res = await apiFetch(
    `${API_BASE}/rooms/${roomId}/bookmarks/${bookmarkId}`,
    { method: "DELETE" },
  );
  if (!res.ok) throw new Error(`보관함 항목 삭제 실패: ${res.status}`);
}
