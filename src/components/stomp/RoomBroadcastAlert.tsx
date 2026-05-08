"use client";

import type { ReactNode } from "react";
import type { QueryClient } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";

import {
  getBookmarkCategories,
  getRoomMembers,
  type BookmarkCategory,
  type RoomMember,
  type RoomMemberListResponse,
} from "@/lib/api/rooms";
import { getRoomBookmarks } from "@/lib/api/rooms/bookmarks";
import {
  bookmarkCategoriesQueryKey,
  roomBookmarksQueryKey,
} from "@/lib/queryKeys/bookmarks";
import { roomMembersQueryKey } from "@/lib/queryKeys/rooms";
import type {
  RoomBookmarkChangedEvent,
  RoomBookmarkChangedType,
} from "@/types/roomBookmarkStomp";

export type { RoomBookmarkChangedEvent, RoomBookmarkChangedType };

const BROADCAST_TOAST_DURATION_MS = 3000;

type ShowRoomBroadcastAlertOptions = {
  message: string;
  icon?: ReactNode;
};

/**
 * STOMP 방 브로드캐스트용 알림 — presence / bookmarks 등 동일 형식(sonner, duration).
 */
export function showRoomBroadcastAlert({
  message,
  icon,
}: ShowRoomBroadcastAlertOptions) {
  toast(message, {
    icon,
    duration: BROADCAST_TOAST_DURATION_MS,
  });
}

export function RoomBroadcastBookmarkIcon() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
      <Bookmark className="h-4 w-4" strokeWidth={2.2} aria-hidden />
    </span>
  );
}

function bookmarkChangedMessage(type: RoomBookmarkChangedType): string {
  switch (type) {
    case "BOOKMARK_CREATED":
      return "북마크가 추가되었습니다";
    case "BOOKMARK_UPDATED":
      return "북마크가 변경되었습니다";
    case "BOOKMARK_DELETED":
      return "북마크가 삭제되었습니다";
    case "CATEGORY_CREATED":
      return "북마크 카테고리가 추가되었습니다";
    case "CATEGORY_UPDATED":
      return "북마크 카테고리가 수정되었습니다";
    case "CATEGORY_DELETED":
      return "북마크 카테고리가 삭제되었습니다";
    default:
      return "보관함이 갱신되었습니다";
  }
}

function formatBookmarkBroadcastDetailMessage(
  type: RoomBookmarkChangedType,
  actor: string,
  category: string,
): string {
  switch (type) {
    case "BOOKMARK_CREATED":
      return `${actor}님이 「${category}」에 북마크를 추가했습니다`;
    case "BOOKMARK_UPDATED":
      return `${actor}님이 「${category}」의 북마크를 변경했습니다`;
    case "BOOKMARK_DELETED":
      return `${actor}님이 「${category}」에서 북마크를 삭제했습니다`;
    case "CATEGORY_CREATED":
      return `${actor}님이 북마크 카테고리 「${category}」를 추가했습니다`;
    case "CATEGORY_UPDATED":
      return `${actor}님이 북마크 카테고리 「${category}」를 수정했습니다`;
    case "CATEGORY_DELETED":
      return `${actor}님이 북마크 카테고리 「${category}」를 삭제했습니다`;
    default:
      return bookmarkChangedMessage(type);
  }
}

async function fetchRoomMembersList(
  queryClient: QueryClient,
  roomId: string,
): Promise<RoomMember[] | null> {
  const key = roomMembersQueryKey(roomId);
  const cached = queryClient.getQueryData<RoomMemberListResponse>(key);
  let members = cached?.members;
  if (!members?.length) {
    try {
      const res = await getRoomMembers(roomId);
      queryClient.setQueryData(key, res);
      members = res.members;
    } catch {
      return null;
    }
  }
  return members ?? [];
}

async function resolveActorNickname(
  queryClient: QueryClient,
  roomId: string,
  userId: number,
): Promise<string> {
  const members = await fetchRoomMembersList(queryClient, roomId);
  if (!members?.length) {
    return userId > 0 ? `유저 #${userId}` : "알 수 없는 사용자";
  }
  const nick = members.find((m) => m.userId === userId)?.nickname?.trim();
  if (nick) return nick;
  return userId > 0 ? `유저 #${userId}` : "알 수 없는 사용자";
}

/**
 * payload에 닉네임/카테고리명이 없을 때 React Query 캐시·필요 시 GET으로 보강해 토스트 문구 생성.
 * CATEGORY_DELETED는 무효화 전 캐시에 남아 있던 이름을 우선 사용합니다.
 */
export async function buildBookmarkBroadcastMessage(
  queryClient: QueryClient,
  event: RoomBookmarkChangedEvent,
): Promise<string> {
  const rid = String(event.roomId ?? "").trim();
  if (!rid) return bookmarkChangedMessage(event.type);

  const categoriesFromCache = (): BookmarkCategory[] | undefined =>
    queryClient.getQueryData<BookmarkCategory[]>(
      bookmarkCategoriesQueryKey(rid),
    );

  let categoryLabel = categoriesFromCache()
    ?.find((c) => c.categoryId === event.categoryId)
    ?.name?.trim();

  if (!categoryLabel) {
    const t = event.type;
    const isBookmarkDispatch =
      t === "BOOKMARK_CREATED" ||
      t === "BOOKMARK_UPDATED" ||
      t === "BOOKMARK_DELETED";
    const isCategoryUpsert = t === "CATEGORY_CREATED" || t === "CATEGORY_UPDATED";

    if (isBookmarkDispatch) {
      try {
        const rows = await getRoomBookmarks(rid, event.categoryId);
        queryClient.setQueryData(
          roomBookmarksQueryKey(rid, event.categoryId),
          rows,
        );
        categoryLabel =
          rows.find((r) => r.bookmarkId === event.bookmarkId)?.category?.trim() ??
          rows[0]?.category?.trim() ??
          undefined;
      } catch {
        /* 아래 카테고리 목록 fallback */
      }
    }

    if (!categoryLabel && isCategoryUpsert) {
      try {
        const fresh = await getBookmarkCategories(rid);
        queryClient.setQueryData(bookmarkCategoriesQueryKey(rid), fresh);
        categoryLabel =
          fresh.find((c) => c.categoryId === event.categoryId)?.name?.trim() ??
          undefined;
      } catch {
        /* */
      }
    }

    if (!categoryLabel && t !== "CATEGORY_DELETED") {
      try {
        const fresh = await getBookmarkCategories(rid);
        queryClient.setQueryData(bookmarkCategoriesQueryKey(rid), fresh);
        categoryLabel =
          fresh.find((c) => c.categoryId === event.categoryId)?.name?.trim() ??
          undefined;
      } catch {
        /* */
      }
    }
  }

  const category =
    categoryLabel && categoryLabel.length > 0
      ? categoryLabel
      : `카테고리 #${event.categoryId}`;

  const actor = await resolveActorNickname(queryClient, rid, event.actorUserId);

  return formatBookmarkBroadcastDetailMessage(event.type, actor, category);
}
