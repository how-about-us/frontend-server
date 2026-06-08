// ─── Request / Response types ───────────────────────────────────────────────

import type { ServerChatMessageType } from "@/types/chat";

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
  startDate: string | null;
  endDate: string | null;
  inviteCode: string;
  memberCount: number;
  role: string;
  createdAt: string;
};

export type RoomListItem = {
  id: string;
  title: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
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
  startDate: string | null;
  endDate: string | null;
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

export type RoomMemberStatus = "ACTIVE" | "LEFT" | "PENDING";

export type RoomMember = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  role: "HOST" | "MEMBER";
  status: RoomMemberStatus;
  joinedAt: string;
  isOnline: boolean;
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
  messageType: ServerChatMessageType;
  content: string;
  metadata?: Record<string, string>;
  createdAt: string;
  clientMessageId?: string;
  sequence?: number;
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

/** POST /rooms/:roomId/bookmarks — 여러 카테고리에 동일 장소를 한 번에 추가 */
export type RoomBookmarkBulkCreateRequest = {
  googlePlaceId: string;
  categoryIds: number[];
};

export type RoomBookmarkCategoryPatchRequest = {
  categoryId: number;
};
