"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

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
      roomId?.length ?
        tripYmdBoundsFromRoomSources(roomId, listRooms, roomMeta ?? undefined)
      : { startYmd: "", endYmd: "" },
    [listRooms, roomId, roomMeta],
  );

  const currentRoom = roomId?.length
    ? (listRooms ?? []).find((r) => r.id === roomId)
    : undefined;

  const dateStr =
    currentRoom ?
      formatRoomTripSubtitleKo(tripMeta.startYmd, tripMeta.endYmd)
    : "";

  return (
    <Link href="/home" className="block">
      <header className="border-b border-gray-border px-1 py-1 transition hover:bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="bg-white px-2.5 py-1.5">
            {currentRoom ? (
              <>
                <span className="block text-sm font-semibold leading-tight">
                  {currentRoom.title}
                </span>
                <span className="block text-xs leading-tight text-dark-gray">
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
              <span className="block text-sm font-semibold leading-tight text-dark-gray">
                {roomMeta?.title ?? "방 정보 없음"}
              </span>
            )}
          </div>
          <Image alt="logo" src="/icons/logo.svg" width={150} height={20} />
        </div>
      </header>
    </Link>
  );
};

export default HeaderBar;
