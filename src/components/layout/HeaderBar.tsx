"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import { useRooms } from "@/stores/rooms-store";
import { useSessionStore } from "@/stores/session-store";

const HeaderBar = () => {
  const params = useParams();
  // URL에 roomId가 있으면 그것을, 없으면 마지막으로 열었던 방 ID를 사용
  const paramRoomId = typeof params.roomId === "string" ? params.roomId : undefined;
  const storedRoomId = useSessionStore((s) => s.currentRoomId);
  const roomId = paramRoomId ?? storedRoomId ?? undefined;

  const { rooms } = useRooms();
  const currentRoom = roomId ? rooms.find((r) => r.id === roomId) : undefined;

  return (
    <header className="border-b border-gray-border px-1 py-1">
      <div className="flex items-center justify-between">
        <div className="rounded-lg border-r-3 border-brand-red bg-white px-2.5 py-1.5">
          {currentRoom ? (
            <>
              <span className="block text-sm font-semibold leading-tight">
                {currentRoom.title}
              </span>
              {currentRoom.date && (
                <span className="block text-xs leading-tight text-dark-gray">
                  {currentRoom.date}
                </span>
              )}
            </>
          ) : (
            <span className="block text-sm font-semibold leading-tight text-dark-gray">
              방을 선택해주세요
            </span>
          )}
        </div>
        <Link href="/home">
          <Image alt="logo" src="/icons/logo.svg" width={150} height={20} />
        </Link>
      </div>
    </header>
  );
};

export default HeaderBar;
