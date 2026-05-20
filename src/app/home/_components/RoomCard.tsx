"use client";

import Link from "next/link";

import { RoomListItem } from "@/lib/api/rooms";
import { planPathForRoom } from "@/lib/join-room-workflow";
import { isHostRole } from "@/lib/rooms";
import { formatUnreadCount } from "@/lib/chat/unread";
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
    <div className="group">
      <div className="relative">
        <Link href={planPath} className="block" onClick={handleNavigate}>
          <div
            className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br ${gradient}`}
          >
            {unreadCount > 0 ? (
              <span className="absolute left-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {unreadLabel}
              </span>
            ) : null}
          </div>
        </Link>
        {isHostRole(room.role) && (
          <div className="absolute right-2 top-2 z-10">
            <RoomCardMenu room={room} onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
      </div>

      <Link href={planPath} className="mt-2 block" onClick={handleNavigate}>
        <p className="text-sm font-semibold">{room.title}</p>
        <p className="mt-0.5 text-xs text-dark-gray">{room.destination}</p>
        {dateStr && <p className="mt-0.5 text-xs text-light-gray">{dateStr}</p>}
      </Link>
    </div>
  );
}
