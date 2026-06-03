"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";

import { MobileReadOnlyNotice } from "@/components/mobile/MobileReadOnlyNotice";
import { useMobileView } from "@/contexts/MobileViewContext";
import { useRoomsList } from "@/hooks/useRooms";
import {
  pageToolbarButtonIconClass,
  pageToolbarButtonIconStroke,
  pageToolbarButtonPaddingClass,
} from "@/components/layout/page-toolbar-button";
import { cn } from "@/lib/utils";
import { RoomListItem } from "@/lib/api/rooms";
import { SiteFooter } from "@/components/layout/SiteFooter";

import { HomeHeader } from "./_components/HomeHeader";
import { RoomGrid } from "./_components/RoomGrid";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";
import { LeaveConfirmModal } from "./_components/LeaveConfirmModal";

export default function HomePage() {
  const { isMobileDevice } = useMobileView();
  const { data, isLoading, isError, refetch } = useRoomsList();
  const rooms = data?.rooms ?? [];

  const [deletingRoom, setDeletingRoom] = useState<RoomListItem | null>(null);
  const [leavingRoom, setLeavingRoom] = useState<RoomListItem | null>(null);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <MobileReadOnlyNotice />
      <HomeHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {!isMobileDevice ? (
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
        ) : null}

        <div className={isMobileDevice ? "mt-0" : "mt-6"}>
          <RoomGrid
            rooms={rooms}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onDelete={setDeletingRoom}
            onLeave={setLeavingRoom}
          />
        </div>
      </main>

      <SiteFooter />

      {deletingRoom && (
        <DeleteConfirmModal
          room={deletingRoom}
          onClose={() => setDeletingRoom(null)}
        />
      )}

      {leavingRoom && (
        <LeaveConfirmModal
          room={leavingRoom}
          onClose={() => setLeavingRoom(null)}
        />
      )}
    </div>
  );
}
