import type { QueryClient } from "@tanstack/react-query";

import type { RoomDetail, RoomListResponse } from "@/lib/api/rooms";
import { getRoomDetail } from "@/lib/api/rooms";
import { ROOMS_QUERY_KEY, roomDetailQueryKey } from "@/lib/queryKeys/rooms";
import { useSessionStore } from "@/stores/session-store";

/** `GET /rooms/{roomId}` 결과로 room-detail·방 목록·현재 방 세션 메타를 맞춥니다. */
export async function syncRoomDetailFromServer(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  const rid = roomId.trim();
  if (!rid.length) return;
  let detail: RoomDetail;
  try {
    detail = await getRoomDetail(rid);
  } catch {
    return;
  }
  queryClient.setQueryData<RoomDetail>(roomDetailQueryKey(rid), detail);
  queryClient.setQueryData<RoomListResponse>(ROOMS_QUERY_KEY, (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      rooms: prev.rooms.map((r) =>
        r.id === rid ?
          {
            ...r,
            title: detail.title,
            destination: detail.destination,
            startDate: detail.startDate,
            endDate: detail.endDate,
          }
        : r,
      ),
    };
  });
  const { currentRoomId, setCurrentRoomMeta } = useSessionStore.getState();
  if (currentRoomId?.trim() === rid) {
    setCurrentRoomMeta(detail);
  }
}
