"use client";

import type { ReactNode } from "react";
import { Bookmark } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

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

export function RoomBroadcastProfileIcon({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <Image
      src={url}
      alt=""
      width={24}
      height={24}
      className="h-6 w-6 rounded-full object-cover"
    />
  );
}

export function RoomBroadcastBookmarkIcon() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-red/10 text-brand-red">
      <Bookmark className="h-4 w-4" strokeWidth={2.2} aria-hidden />
    </span>
  );
}

export type RoomBookmarkChangedType =
  | "BOOKMARK_CREATED"
  | "BOOKMARK_UPDATED"
  | "BOOKMARK_DELETED"
  | "CATEGORY_CREATED"
  | "CATEGORY_UPDATED"
  | "CATEGORY_DELETED";

export type RoomBookmarkChangedEvent = {
  actorUserId: number;
  bookmarkId: number;
  categoryId: number;
  roomId: string;
  type: RoomBookmarkChangedType;
};

export function bookmarkChangedMessage(type: RoomBookmarkChangedType): string {
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
