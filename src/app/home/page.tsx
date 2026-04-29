"use client";

import Link from "next/link";
import { useState } from "react";

import { useRoomsList } from "@/hooks/useRooms";
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">나의 여행 계획</h1>
          <Link
            href="/home/new"
            className="flex items-center gap-1.5 rounded-full bg-brand-red px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            + 새 여행 계획
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
