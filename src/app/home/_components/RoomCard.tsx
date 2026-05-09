"use client";

import Image from "next/image";
import Link from "next/link";

import { RoomListItem } from "@/lib/api/rooms";
import { isHostRole } from "@/lib/rooms";
import {
  usePlacePhotoUrlQuery,
  useRoomCoverPhotoName,
} from "@/hooks/useRoomCoverPhoto";
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

  const { data: coverPhotoName } = useRoomCoverPhotoName(room);
  const { data: coverPhotoUrl } = usePlacePhotoUrlQuery(coverPhotoName);

  const dateStr = formatDateRange(room.startDate, room.endDate);

  return (
    <div className="group">
      <div className="relative">
        <div
          className={`relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br ${gradient}`}
        >
          {coverPhotoUrl ? (
            <Image
              src={coverPhotoUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
            />
          ) : null}
        </div>
        {isHostRole(room.role) && (
          <div className="absolute right-2 top-2">
            <RoomCardMenu room={room} onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
      </div>

      <Link
        href="/plan"
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
