"use client";

import Link from "next/link";

import { RoomListItem } from "@/lib/api/rooms";
import { getRoomGradient } from "@/stores/rooms-store";
import { useSessionStore } from "@/stores/session-store";
import { RoomCardMenu } from "./RoomCardMenu";
import { formatDateRange } from "./utils";

type Props = {
  room: RoomListItem;
  onEdit: (room: RoomListItem) => void;
  onDelete: (room: RoomListItem) => void;
};

export function RoomCard({ room, onEdit, onDelete }: Props) {
  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);
  const gradient = getRoomGradient(room.id);
  const dateStr = formatDateRange(room.startDate, room.endDate);

  return (
    <div className="group">
      <div className="relative">
        <div
          className={`aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br ${gradient}`}
        />
        <div className="absolute right-2 top-2">
          <RoomCardMenu room={room} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>

      <Link
        href={`/plan/${room.id}`}
        className="mt-2 block"
        onClick={() => setCurrentRoomId(room.id)}
      >
        <p className="text-sm font-semibold">{room.title}</p>
        <p className="mt-0.5 text-xs text-dark-gray">{room.destination}</p>
        {dateStr && (
          <p className="mt-0.5 text-xs text-light-gray">{dateStr}</p>
        )}
      </Link>
    </div>
  );
}
