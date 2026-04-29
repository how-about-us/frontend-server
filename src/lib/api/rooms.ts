const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const FETCH_OPTS: RequestInit = {
  credentials: "include",
};

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
  const res = await fetch(`${API_BASE}/rooms`, {
    ...FETCH_OPTS,
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

  const res = await fetch(url.toString(), FETCH_OPTS);
  if (!res.ok) throw new Error(`방 목록 조회 실패: ${res.status}`);
  return res.json();
}

export type RoomUpdateRequest = {
  title?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
};

export async function updateRoom(
  roomId: string,
  data: RoomUpdateRequest,
): Promise<RoomCreateResponse> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
    ...FETCH_OPTS,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`방 수정 실패: ${res.status}`);
  return res.json();
}

export async function deleteRoom(roomId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}`, {
    ...FETCH_OPTS,
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`방 삭제 실패: ${res.status}`);
}

export async function regenerateInviteCode(
  roomId: string,
): Promise<{ inviteCode: string }> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/invite-code`, {
    ...FETCH_OPTS,
    method: "POST",
  });
  if (!res.ok) throw new Error(`초대 코드 재발급 실패: ${res.status}`);
  return res.json();
}
