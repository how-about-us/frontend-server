"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useEffectiveMainRoomId } from "@/hooks/useEffectiveMainRoomId";
import { useRoomsList } from "@/hooks/useRooms";
import { useSessionStore } from "@/stores/session-store";

function formatDateRange(startDate: string, endDate: string): string {
  const fmt = (d: string) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };
  if (!startDate && !endDate) return "";
  if (startDate === endDate) return fmt(startDate);
  return `${fmt(startDate)} – ${fmt(endDate)}`;
}

const HeaderBar = () => {
  const effective = useEffectiveMainRoomId();
  const params = useParams();
  const storedRoomId = useSessionStore((s) => s.currentRoomId);
  const { data, isPending } = useRoomsList();

  if (!effective) return null;

  const paramRoomId =
    typeof params.roomId === "string" ? params.roomId : undefined;
  const roomId = paramRoomId ?? storedRoomId ?? undefined;

  const currentRoom = roomId
    ? (data?.rooms ?? []).find((r) => r.id === roomId)
    : undefined;

  const dateStr = currentRoom
    ? formatDateRange(currentRoom.startDate, currentRoom.endDate)
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
              <span
                className="inline-block min-h-[1.25rem] align-top"
                aria-hidden
              />
            )}
          </div>
          <Image alt="logo" src="/icons/logo.svg" width={150} height={20} />
        </div>
      </header>
    </Link>
  );
};

export default HeaderBar;
