"use client";

import Link from "next/link";

import { RoomListItem } from "@/lib/api/rooms";
import { RoomCard } from "./RoomCard";

type Props = {
  rooms: RoomListItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEdit: (room: RoomListItem) => void;
  onDelete: (room: RoomListItem) => void;
};

export function RoomGrid({
  rooms,
  isLoading,
  isError,
  onRetry,
  onEdit,
  onDelete,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-border border-t-brand-red" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-border py-20 text-center">
        <p className="text-sm font-medium text-dark-gray">
          여행 목록을 불러오지 못했어요
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-border py-20 text-center">
        <p className="text-sm font-medium text-dark-gray">아직 여행이 없어요</p>
        <p className="mt-1 text-xs text-light-gray">
          새 여행 계획을 만들어 시작해보세요
        </p>
        <Link
          href="/home/new"
          className="mt-4 rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          + 새 여행 계획
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
