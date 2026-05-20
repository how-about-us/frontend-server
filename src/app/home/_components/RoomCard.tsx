"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";

import { RoomListItem } from "@/lib/api/rooms";
import { planPathForRoom } from "@/lib/join-room-workflow";
import { isHostRole } from "@/lib/rooms";
import { useRoomUnreadCount } from "@/hooks/useRooms";
import { getRoomGradient } from "@/stores/rooms-store";
import { useSessionStore } from "@/stores/session-store";
import { RoomCardMenu } from "./RoomCardMenu";
import { formatTripYmdRangeShortKo as formatDateRange } from "@/lib/plan/tripRange";

type Props = {
  room: RoomListItem;
  onEdit: (room: RoomListItem) => void;
  onDelete: (room: RoomListItem) => void;
};

export function RoomCard({ room, onEdit, onDelete }: Props) {
  const setCurrentRoomId = useSessionStore((s) => s.setCurrentRoomId);
  const gradient = getRoomGradient(room.id);

  const { data: unreadData } = useRoomUnreadCount(room.id);
  const unreadCount = unreadData?.unreadCount ?? 0;
  const unreadLabel = unreadCount >= 100 ? "99+" : String(unreadCount);

  const dateStr = formatDateRange(room.startDate, room.endDate);
  const planPath = planPathForRoom(room.id);

  const handleNavigate = () => setCurrentRoomId(room.id);

  return (
    <div className="group relative">
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

          <div
            className={`min-w-0 flex-1 ${isHostRole(room.role) ? "pr-7" : ""}`}
          >
            <p className="truncate text-sm font-semibold">{room.title}</p>
            <p className="mt-0.5 truncate text-xs text-dark-gray">
              {room.destination}
            </p>
            {dateStr ? (
              <p className="mt-1 text-xs text-light-gray">{dateStr}</p>
            ) : null}
          </div>
        </div>

        {unreadCount > 0 ? (
          <span className="absolute bottom-3 right-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 text-[10px] font-bold text-white">
            {unreadLabel}
          </span>
        ) : null}
      </Link>

      {isHostRole(room.role) ? (
        <div className="absolute right-3 top-3 z-10">
          <RoomCardMenu room={room} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ) : null}
    </div>
  );
}
