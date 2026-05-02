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

export type RoomMessage = {
  id: string;
  roomId: string;
  senderId: number;
  messageType: "CHAT" | "AI";
  content: string;
  metadata?: Record<string, string>;
  createdAt: string;
};

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

// ─── Room bookmarks ──────────────────────────────────────────────────────────

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

export type RoomBookmarkCategoryPatchRequest = {
  categoryId: number;
};
