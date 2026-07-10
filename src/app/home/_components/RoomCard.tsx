"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";

import { RoomListItem } from "@/lib/api/rooms";
import { planPathForRoom } from "@/lib/join-room-workflow";
import { getRoomGradient } from "@/stores/rooms-store";
import { useSessionStore } from "@/stores/session-store";
import { RoomCardMenu } from "./RoomCardMenu";
import { formatTripYmdRangeShortKo as formatDateRange } from "@/lib/plan/tripRange";

type Props = {
  room: RoomListItem;
  onDelete: (room: RoomListItem) => void;
  onLeave: (room: RoomListItem) => void;
};

export function RoomCard({ room, onDelete, onLeave }: Props) {
  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);
  const gradient = getRoomGradient(room.id);

  const dateStr = formatDateRange(room.startDate, room.endDate);
  const planPath = planPathForRoom(room.id);

  const handleNavigate = () => setCurrentRoomId(room.id);

  return (
    <div className="relative">
      <Link
        href={planPath}
        onClick={handleNavigate}
        className="relative block rounded-2xl border-2 border-gray-border bg-white p-4 transition hover:border-brand-red/40 hover:shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}
            aria-hidden
          >
            <MapPin size={18} className="text-white" strokeWidth={2.25} />
          </div>

          <div className="min-w-0 flex-1 pr-7">
            <p className="truncate text-[17px] font-semibold">{room.title}</p>
            <p className="mt-0.5 truncate text-[14px] text-dark-gray">
              {room.destination}
            </p>
            {dateStr ? (
              <p className="mt-1 text-[14px] text-light-gray">{dateStr}</p>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="absolute right-3 top-3 z-10">
        <RoomCardMenu room={room} onDelete={onDelete} onLeave={onLeave} />
      </div>
    </div>
  );
}
