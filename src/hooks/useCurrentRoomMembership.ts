"use client";

import { useCurrentRoomId } from "@/hooks/use-room-id";
import { useRoomDetail } from "@/hooks/useRoomDetail";
import { useRoomMembers, useRoomsList } from "@/hooks/useRooms";
import { useSessionUser } from "@/hooks/useSessionUser";
import type { RoomDetail, RoomListItem } from "@/lib/api/rooms";
import { resolveViewerIsHost } from "@/lib/rooms";

type RoomSource = RoomListItem | RoomDetail;

export function useCurrentRoomMembership() {
  const { data: user } = useSessionUser();
  const { roomId: currentRoomId } = useCurrentRoomId();
  const { data: roomsData, isPending: isRoomsLoading } = useRoomsList();
  const { data: roomDetail, isPending: isDetailLoading } =
    useRoomDetail(currentRoomId);
  const { data: membersData, isLoading: isMembersLoading } =
    useRoomMembers(currentRoomId);

  const currentRoom = roomsData?.rooms.find((r) => r.id === currentRoomId);
  const roomSource: RoomSource | null =
    currentRoom ??
    (roomDetail && roomDetail.id === currentRoomId ? roomDetail : null);

  const members = membersData?.members ?? [];
  const me = members.find((m) => m.userId === user?.id);
  const isHost = resolveViewerIsHost({
    listRole: currentRoom?.role,
    detailRole: roomDetail?.role,
    memberRole: me?.role,
  });

  return {
    user,
    roomId: currentRoomId,
    currentRoom,
    roomDetail,
    roomSource,
    members,
    me,
    others: members.filter((m) => m.userId !== user?.id),
    isHost,
    isLoading: isRoomsLoading || isDetailLoading || isMembersLoading,
    isMembersLoading,
  };
}
