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
  const res = await fetch(`${API_BASE}/rooms/${roomId}`, FETCH_OPTS);
  if (!res.ok) throw new Error(`방 상세 조회 실패: ${res.status}`);
  return res.json();
}

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

export async function getRoomMembers(
  roomId: string,
): Promise<RoomMemberListResponse> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/members`, FETCH_OPTS);
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
  const res = await fetch(
    `${API_BASE}/rooms/${roomId}/join/status`,
    FETCH_OPTS,
  );
  if (!res.ok)
    throw new HttpError(res.status, `입장 상태 조회 실패: ${res.status}`);
  return res.json();
}

export async function joinRoom(inviteCode: string): Promise<JoinRoomResponse> {
  const res = await fetch(`${API_BASE}/rooms/join`, {
    ...FETCH_OPTS,
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
  const res = await fetch(
    `${API_BASE}/rooms/${roomId}/join-requests`,
    FETCH_OPTS,
  );
  if (!res.ok) throw new Error(`입장 요청 목록 조회 실패: ${res.status}`);
  return res.json();
}

export async function transferHost(
  roomId: string,
  targetUserId: number,
): Promise<void> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/host`, {
    ...FETCH_OPTS,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetUserId }),
  });
  if (!res.ok) throw new HttpError(res.status, `방장 위임 실패: ${res.status}`);
}

export async function leaveRoom(roomId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/members/me`, {
    ...FETCH_OPTS,
    method: "DELETE",
  });
  if (!res.ok) throw new HttpError(res.status, `방 나가기 실패: ${res.status}`);
}

export async function kickMember(
  roomId: string,
  userId: number,
): Promise<void> {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/members/${userId}`, {
    ...FETCH_OPTS,
    method: "DELETE",
  });
  if (!res.ok) throw new HttpError(res.status, `멤버 추방 실패: ${res.status}`);
}

export async function approveJoinRequest(
  roomId: string,
  requestId: number,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/rooms/${roomId}/join-requests/${requestId}/approve`,
    { ...FETCH_OPTS, method: "POST" },
  );
  if (!res.ok) throw new Error(`입장 승인 실패: ${res.status}`);
}

export async function rejectJoinRequest(
  roomId: string,
  requestId: number,
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/rooms/${roomId}/join-requests/${requestId}/reject`,
    { ...FETCH_OPTS, method: "POST" },
  );
  if (!res.ok) throw new Error(`입장 거절 실패: ${res.status}`);
}
