import type { QueryClient } from "@tanstack/react-query";

import type { RoomMemberListResponse } from "@/lib/api/rooms";

/** 백엔드 placeholder 닉네임·빈 문자열 — 실제 표시명으로 캐시에서 대체 */
export function isPlaceholderMemberNickname(s: string): boolean {
  const t = s.trim();
  if (!t.length) return true;
  return /^멤버\s*#\d+$/u.test(t) || /^member\s*#\d+$/iu.test(t);
}

export function nicknameFromRoomMembersCache(
  queryClient: QueryClient,
  roomId: string,
  userId: number,
): string | null {
  if (userId <= 0) return null;
  const data = queryClient.getQueryData<RoomMemberListResponse>([
    "room-members",
    roomId,
  ]);
  const nick = data?.members.find((m) => m.userId === userId)?.nickname?.trim();
  if (!nick?.length || isPlaceholderMemberNickname(nick)) return null;
  return nick;
}

export function profileImageUrlFromRoomMembersCache(
  queryClient: QueryClient,
  roomId: string,
  userId: number,
): string | null {
  if (userId <= 0) return null;
  const data = queryClient.getQueryData<RoomMemberListResponse>([
    "room-members",
    roomId,
  ]);
  const url = data?.members.find((m) => m.userId === userId)?.profileImageUrl;
  if (typeof url !== "string") return null;
  const t = url.trim();
  return t.length > 0 ? t : null;
}

/** STOMP presence 페이로드 URL이 비었을 때 room-members 캐시로 보강 */
export function resolvePresenceProfileImageUrl(
  queryClient: QueryClient,
  roomId: string,
  userId: number,
  payloadProfileUrl: string | null,
): string | null {
  const trimmed =
    typeof payloadProfileUrl === "string" && payloadProfileUrl.trim().length > 0
      ? payloadProfileUrl.trim()
      : null;
  if (trimmed) return trimmed;
  return profileImageUrlFromRoomMembersCache(queryClient, roomId, userId);
}

export function resolvePresenceDisplayName(
  queryClient: QueryClient,
  roomId: string,
  userId: number,
  nickname: string | null,
): string {
  const trimmed = typeof nickname === "string" ? nickname.trim() : "";
  if (trimmed.length && !isPlaceholderMemberNickname(trimmed)) return trimmed;
  const fromCache = nicknameFromRoomMembersCache(queryClient, roomId, userId);
  if (fromCache) return fromCache;
  return userId > 0 ? `유저 #${userId}` : "알 수 없는 사용자";
}

export function userIdFromMemberMetadata(
  metadata: Record<string, unknown>,
): number | null {
  const candidates = [
    metadata.userId,
    metadata.targetUserId,
    metadata.memberUserId,
    metadata.affectedUserId,
  ];
  for (const v of candidates) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const t = v.trim();
      if (t.length && /^\d+$/.test(t)) return Number(t);
    }
  }
  return null;
}

/** members 브로드캐스트 `content` 안의 "멤버#n" 등을 캐시 닉네임으로 치환 (metadata에 userId 계열이 있을 때) */
export function substitutePlaceholderMemberLabelsInContent(
  queryClient: QueryClient,
  roomId: string,
  content: string,
  metadata: Record<string, unknown>,
): string {
  if (!/멤버\s*#\d+|member\s*#\d+/iu.test(content)) return content;
  const uid = userIdFromMemberMetadata(metadata);
  if (uid == null) return content;
  const nick = nicknameFromRoomMembersCache(queryClient, roomId, uid);
  if (!nick) return content;
  return content
    .replace(/멤버\s*#\d+/giu, nick)
    .replace(/member\s*#\d+/giu, nick);
}
