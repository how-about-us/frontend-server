"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useMemo } from "react";

import { BrandLogo } from "@/components/BrandLogo";

import { useRoomsList } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";
import {
  formatRoomTripSubtitleKo,
  tripYmdBoundsFromRoomSources,
} from "@/lib/plan/tripRange";

const HeaderBar = () => {
  const storedRoomId = useSessionStore((s) => s.currentRoomId);
  const roomMeta = useSessionStore((s) => s.currentRoomMeta);
  const { data, isPending } = useRoomsList();

  const roomId =
    typeof storedRoomId === "string" ? storedRoomId.trim() : undefined;

  const listRooms = data?.rooms;

  const tripMeta = useMemo(
    () =>
      roomId?.length
        ? tripYmdBoundsFromRoomSources(roomId, listRooms, roomMeta ?? undefined)
        : { startYmd: "", endYmd: "" },
    [listRooms, roomId, roomMeta],
  );

  const currentRoom = roomId?.length
    ? (listRooms ?? []).find((r) => r.id === roomId)
    : undefined;

  const dateStr = currentRoom
    ? formatRoomTripSubtitleKo(tripMeta.startYmd, tripMeta.endYmd)
    : "";

  return (
    <header className="border-b-2 border-brand-red">
      <div className="flex items-center">
        <div className="relative flex w-13 shrink-0 flex-col items-center justify-center py-1.5">
          <Link
            href="/home"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-dark-gray transition-colors hover:bg-light-gray"
            aria-label="홈으로 이동"
          >
            <Home className="h-6 w-6" strokeWidth={2} aria-hidden />
          </Link>
          <div
            className="pointer-events-none absolute right-0 top-1/2 h-8 w-px -translate-y-1/2 bg-gray-border"
            aria-hidden
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-5 py-1 pr-2">
          <div className="min-w-0 bg-white py-1.5">
            {currentRoom ? (
              <>
                <span className="block truncate text-sm font-semibold leading-tight">
                  {currentRoom.title}
                </span>
                <span className="block truncate text-xs leading-tight text-dark-gray">
                  {dateStr}
                </span>
              </>
            ) : isPending ? (
              <span
                className="block text-sm font-semibold leading-tight text-dark-gray"
                aria-busy="true"
              >
                …
              </span>
            ) : (
              <span className="block truncate text-sm font-semibold leading-tight text-dark-gray">
                {roomMeta?.title ?? "방 정보 없음"}
              </span>
            )}
          </div>
          <BrandLogo alt="logo" width={150} height={20} />
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
