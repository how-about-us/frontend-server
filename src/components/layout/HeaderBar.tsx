"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import { useRoomSchedules, useRoomsList } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";
import { sortRoomSchedules } from "@/lib/plan/scheduleMerge";
import {
  formatTripYmdRangeShortKo,
  tripBoundsMergedWithScheduleDates,
  tripYmdBoundsFromRoomSources,
} from "@/lib/plan/tripRange";

const HeaderBar = () => {
  const storedRoomId = useSessionStore((s) => s.currentRoomId);
  const roomMeta = useSessionStore((s) => s.currentRoomMeta);
  const { data, isPending } = useRoomsList();

  const roomId =
    typeof storedRoomId === "string" ? storedRoomId.trim() : undefined;

  const roomIdForSchedules =
    roomId && roomId.length > 0 ? roomId : null;

  const { data: schedules } = useRoomSchedules(roomIdForSchedules);

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

  const { startYmd: displayStart, endYmd: displayEnd } = useMemo(() => {
    if (!currentRoom || !tripMeta.startYmd || !tripMeta.endYmd) {
      return { startYmd: "", endYmd: "" };
    }
    const dates = schedules?.length
      ? sortRoomSchedules(schedules).map((s) => s.date)
      : [];
    return tripBoundsMergedWithScheduleDates(
      tripMeta.startYmd,
      tripMeta.endYmd,
      dates,
    );
  }, [currentRoom, schedules, tripMeta.endYmd, tripMeta.startYmd]);

  const dateStr =
    currentRoom && displayStart && displayEnd
      ? formatTripYmdRangeShortKo(displayStart, displayEnd)
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
                {dateStr && (
                  <span className="block text-xs leading-tight text-dark-gray">
                    {dateStr}
                  </span>
                )}
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
