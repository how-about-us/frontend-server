"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";

import { useRoomsList } from "@/hooks/useRooms";
import {
  pageToolbarButtonIconClass,
  pageToolbarButtonIconStroke,
  pageToolbarButtonPaddingClass,
} from "@/components/layout/page-toolbar-button";
import { cn } from "@/lib/utils";
import { RoomListItem } from "@/lib/api/rooms";
import { HomeHeader } from "./_components/HomeHeader";
import { RoomGrid } from "./_components/RoomGrid";
import { EditRoomModal } from "./_components/EditRoomModal";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useRoomsList();
  const rooms = data?.rooms ?? [];

  const [editingRoom, setEditingRoom] = useState<RoomListItem | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<RoomListItem | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <HomeHeader />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-end">
          <Link
            href="/home/new"
            className={cn(
              "flex items-center gap-1.5 rounded-full bg-brand-red text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-95 active:opacity-90",
              pageToolbarButtonPaddingClass,
            )}
          >
            <Plus
              className={pageToolbarButtonIconClass}
              strokeWidth={pageToolbarButtonIconStroke}
              aria-hidden
            />
            새 여행 계획
          </Link>
        </div>

        <div className="mt-6">
          <RoomGrid
            rooms={rooms}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onEdit={setEditingRoom}
            onDelete={setDeletingRoom}
          />
        </div>
      </main>

      {editingRoom && (
        <EditRoomModal
          room={editingRoom}
          onClose={() => setEditingRoom(null)}
        />
      )}

      {deletingRoom && (
        <DeleteConfirmModal
          room={deletingRoom}
          onClose={() => setDeletingRoom(null)}
        />
      )}
    </div>
  );
}
