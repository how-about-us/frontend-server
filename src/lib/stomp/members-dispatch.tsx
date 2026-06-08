"use client";

import type { QueryClient } from "@tanstack/react-query";

import type {
  RoomListResponse,
  RoomMember,
  RoomMemberListResponse,
} from "@/lib/api/rooms";
import { ROOMS_QUERY_KEY, roomMembersQueryKey } from "@/lib/query-keys";
import { readSessionUserId } from "@/lib/session-user-cache";

import type { RoomMemberPayload } from "./member-events";

function upsertMemberRow(
  members: RoomMember[],
  userId: number,
  patch: Partial<RoomMember> & Pick<RoomMember, "status">,
  fallback: Omit<RoomMember, "userId">,
): RoomMember[] {
  const idx = members.findIndex((m) => m.userId === userId);
  if (idx >= 0) {
    const next = [...members];
    const cur = next[idx]!;
    next[idx] = { ...cur, ...patch };
    return next;
  }
  return [...members, { userId, ...fallback, ...patch }];
}

function patchRoomsRoleForHostDelegation(
  queryClient: QueryClient,
  roomId: string,
  previousHostUserId: number,
  newHostUserId: number,
): void {
  const me = readSessionUserId(queryClient);
  if (me == null) return;

  queryClient.setQueryData<RoomListResponse>(ROOMS_QUERY_KEY, (prev) => {
    if (!prev?.rooms?.length) return prev;
    return {
      ...prev,
      rooms: prev.rooms.map((r) => {
        if (r.id !== roomId) return r;
        if (me === previousHostUserId) return { ...r, role: "MEMBER" };
        if (me === newHostUserId) return { ...r, role: "HOST" };
        return r;
      }),
    };
  });
}

/**
 * members STOMP 한 건 — `metadata`만으로 `room-members`·방 목록(role) 캐시를 직접 갱신합니다.
 * 채팅 UI는 room-members 캐시의 userId와 메시지 senderId 매핑으로 발신자를 표시합니다.
 */
export function dispatchRoomMemberEvent(
  queryClient: QueryClient,
  subscribedRoomId: string,
  event: RoomMemberPayload,
): void {
  const rid = String(event.roomId ?? "").trim() || subscribedRoomId;
  if (!rid) return;

  switch (event.type) {
    case "MEMBER_JOINED": {
      const d = event.detail;
      if (!d) return;

      queryClient.setQueryData<RoomMemberListResponse>(
        roomMembersQueryKey(rid),
        (prev) => {
          const members = prev?.members ?? [];
          const joinedAt =
            event.createdAt.trim().length > 0
              ? event.createdAt
              : new Date().toISOString();
          const next = upsertMemberRow(
            members,
            d.userId,
            {
              nickname: d.nickname,
              profileImageUrl: d.profileImageUrl,
              status: "ACTIVE",
              isOnline: true,
            },
            {
              nickname: d.nickname,
              profileImageUrl: d.profileImageUrl,
              role: "MEMBER",
              status: "ACTIVE",
              joinedAt,
              isOnline: true,
            },
          );
          return prev ? { ...prev, members: next } : { members: next };
        },
      );
      break;
    }

    case "MEMBER_JOIN_REQUESTED": {
      const d = event.detail;
      if (!d) return;

      queryClient.setQueryData<RoomMemberListResponse>(
        roomMembersQueryKey(rid),
        (prev) => {
          const members = prev?.members ?? [];
          const joinedAt =
            event.createdAt.trim().length > 0
              ? event.createdAt
              : new Date().toISOString();
          const next = upsertMemberRow(
            members,
            d.userId,
            {
              nickname: d.nickname,
              profileImageUrl: d.profileImageUrl,
              status: "PENDING",
              isOnline: false,
            },
            {
              nickname: d.nickname,
              profileImageUrl: d.profileImageUrl,
              role: "MEMBER",
              status: "PENDING",
              joinedAt,
              isOnline: false,
            },
          );
          return prev ? { ...prev, members: next } : { members: next };
        },
      );
      break;
    }

    case "MEMBER_LEFT":
    case "MEMBER_KICKED": {
      const d = event.detail;
      if (!d) return;

      queryClient.setQueryData<RoomMemberListResponse>(
        roomMembersQueryKey(rid),
        (prev) => {
          const members = prev?.members ?? [];
          const idx = members.findIndex((m) => m.userId === d.userId);

          if (idx >= 0) {
            const next = [...members];
            const cur = next[idx]!;
            next[idx] = {
              ...cur,
              nickname:
                d.nickname.trim().length > 0 ? d.nickname : cur.nickname,
              profileImageUrl: d.profileImageUrl ?? cur.profileImageUrl,
              status: "LEFT",
              isOnline: false,
            };
            return prev ? { ...prev, members: next } : { members: next };
          }

          const leftMember: RoomMember = {
            userId: d.userId,
            nickname: d.nickname,
            profileImageUrl: d.profileImageUrl,
            role: "MEMBER",
            status: "LEFT",
            joinedAt:
              event.createdAt.trim().length > 0
                ? event.createdAt
                : new Date().toISOString(),
            isOnline: false,
          };
          return {
            members: [...members, leftMember],
          };
        },
      );
      break;
    }

    case "HOST_DELEGATED": {
      const d = event.detail;
      if (!d) return;

      queryClient.setQueryData<RoomMemberListResponse>(
        roomMembersQueryKey(rid),
        (prev) => {
          if (!prev?.members?.length) return prev;
          const members = prev.members.map((m) => {
            if (m.userId === d.previousHostUserId) {
              return {
                ...m,
                role: "MEMBER" as const,
                nickname:
                  d.previousHostNickname.trim().length > 0
                    ? d.previousHostNickname
                    : m.nickname,
              };
            }
            if (m.userId === d.newHostUserId) {
              return {
                ...m,
                role: "HOST" as const,
                nickname:
                  d.newHostNickname.trim().length > 0
                    ? d.newHostNickname
                    : m.nickname,
              };
            }
            return m;
          });
          return { ...prev, members };
        },
      );

      patchRoomsRoleForHostDelegation(
        queryClient,
        rid,
        d.previousHostUserId,
        d.newHostUserId,
      );
      break;
    }

    default:
      break;
  }
}
