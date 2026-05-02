import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  approveJoinRequest,
  createBookmarkCategory,
  createRoomBookmark,
  createRoom,
  createScheduleItem,
  deleteRoomBookmark,
  deleteBookmarkCategory,
  deleteRoom,
  deleteRoomSchedule,
  getBookmarkCategories,
  getJoinRequests,
  getJoinStatus,
  getRoomBookmarks,
  getRoomMembers,
  getRoomSchedules,
  patchRoomBookmarkCategory,
  getRooms,
  joinRoom,
  kickMember,
  leaveRoom,
  regenerateInviteCode,
  rejectJoinRequest,
  RoomCreateRequest,
  RoomUpdateRequest,
  seedRoomSchedules,
  transferHost,
  updateBookmarkCategory,
  updateRoom,
} from "@/lib/api/rooms";
import {
  fetchScheduleItemsAsPlanPlaces,
  isoStartForNewScheduleItem,
} from "@/lib/plan/scheduleItemPlaces";
import { roomSchedulesQueryKey } from "@/lib/queryKeys/roomSchedules";
import { scheduleItemsQueryKey } from "@/lib/queryKeys/scheduleItems";

export const ROOMS_QUERY_KEY = ["rooms"] as const;

export { roomSchedulesQueryKey };

export function useRoomsList() {
  return useQuery({
    queryKey: ROOMS_QUERY_KEY,
    queryFn: () => getRooms(),
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: RoomCreateRequest) => {
      const room = await createRoom(data);
      await seedRoomSchedules(room.id, data.startDate, data.endDate);
      return room;
    },
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: roomSchedulesQueryKey(room.id),
      });
    },
  });
}

export function useRoomSchedules(roomId: string | null) {
  const id = roomId?.trim() ?? "";
  return useQuery({
    queryKey: roomSchedulesQueryKey(id || null),
    queryFn: () => getRoomSchedules(id),
    enabled: id.length > 0,
  });
}

export function useDeleteRoomSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      scheduleId,
    }: {
      roomId: string;
      scheduleId: number;
    }) => deleteRoomSchedule(roomId, scheduleId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({
        queryKey: roomSchedulesQueryKey(roomId),
      });
      queryClient.invalidateQueries({
        queryKey: ["schedule-items", roomId.trim()],
      });
    },
  });
}

export function useSchedulePlanPlaces(
  roomId: string | null,
  scheduleId: number | null,
) {
  const rid = roomId?.trim() ?? "";
  const sid = scheduleId;
  return useQuery({
    queryKey: scheduleItemsQueryKey(rid || null, sid),
    queryFn: () => fetchScheduleItemsAsPlanPlaces(rid, sid!),
    enabled:
      rid.length > 0 && typeof sid === "number" && Number.isFinite(sid),
  });
}

export function useCreateScheduleItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      roomId: string;
      scheduleId: number;
      scheduleDateYmd: string;
      googlePlaceId: string;
      nextSlotIndex: number;
    }) =>
      createScheduleItem(vars.roomId, vars.scheduleId, {
        googlePlaceId: vars.googlePlaceId,
        startTime: isoStartForNewScheduleItem(
          vars.scheduleDateYmd,
          vars.nextSlotIndex,
        ),
        durationMinutes: 60,
      }),
    onSuccess: (_, v) => {
      queryClient.invalidateQueries({
        queryKey: scheduleItemsQueryKey(v.roomId.trim(), v.scheduleId),
      });
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      data,
    }: {
      roomId: string;
      data: RoomUpdateRequest;
    }) => updateRoom(roomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => deleteRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

export function useRegenerateInviteCode() {
  return useMutation({
    mutationFn: (roomId: string) => regenerateInviteCode(roomId),
  });
}

export function useRoomMembers(roomId: string | null) {
  return useQuery({
    queryKey: ["room-members", roomId],
    queryFn: () => getRoomMembers(roomId!),
    enabled: !!roomId,
  });
}

export function useJoinRoom() {
  return useMutation({
    mutationFn: (inviteCode: string) => joinRoom(inviteCode),
  });
}

export function useCheckJoinStatus() {
  return useMutation({
    mutationFn: (roomId: string) => getJoinStatus(roomId),
  });
}

export function useJoinRequests(roomId: string | null) {
  return useQuery({
    queryKey: ["join-requests", roomId],
    queryFn: () => getJoinRequests(roomId!),
    enabled: !!roomId,
    refetchInterval: 8000,
  });
}

export function useTransferHost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      targetUserId,
    }: {
      roomId: string;
      targetUserId: number;
    }) => transferHost(roomId, targetUserId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["room-members", roomId] });
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

export function useLeaveRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => leaveRoom(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

export function useKickMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, userId }: { roomId: string; userId: number }) =>
      kickMember(roomId, userId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["room-members", roomId] });
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

export function useApproveJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      requestId,
    }: {
      roomId: string;
      requestId: number;
    }) => approveJoinRequest(roomId, requestId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["join-requests", roomId] });
      queryClient.invalidateQueries({ queryKey: ["room-members", roomId] });
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
    },
  });
}

export function useRejectJoinRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      requestId,
    }: {
      roomId: string;
      requestId: number;
    }) => rejectJoinRequest(roomId, requestId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({ queryKey: ["join-requests", roomId] });
    },
  });
}

export const bookmarkCategoriesQueryKey = (roomId: string | null) =>
  ["bookmark-categories", roomId] as const;

export function useBookmarkCategories(roomId: string | null) {
  return useQuery({
    queryKey: bookmarkCategoriesQueryKey(roomId),
    queryFn: () => getBookmarkCategories(roomId!),
    enabled: !!roomId,
    staleTime: 0,
  });
}

export function useCreateBookmarkCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      name,
      colorCode,
    }: {
      roomId: string;
      name: string;
      colorCode: string;
    }) => createBookmarkCategory(roomId, { name, colorCode }),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
    },
  });
}

export function useUpdateBookmarkCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      categoryId,
      name,
      colorCode,
    }: {
      roomId: string;
      categoryId: number;
      name: string;
      colorCode: string;
    }) => updateBookmarkCategory(roomId, categoryId, { name, colorCode }),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
    },
  });
}

export function useDeleteBookmarkCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      categoryId,
    }: {
      roomId: string;
      categoryId: number;
    }) => deleteBookmarkCategory(roomId, categoryId),
    onSuccess: (_, { roomId }) => {
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
    },
  });
}

export const roomBookmarksQueryKey = (
  roomId: string | null,
  categoryId: number | null,
) => ["room-bookmarks", roomId, categoryId] as const;

/** STOMP 북마크 브로드캐스트 등 — 카테고리·북마크 목록 refetch + 해당 방 장소 카드 캐시 제거 */
export async function invalidateRoomBookmarkQueries(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  const rid = String(roomId ?? "").trim();
  if (!rid) return;

  queryClient.removeQueries({
    queryKey: ["place-card-bookmark", rid],
  });

  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: bookmarkCategoriesQueryKey(rid),
      refetchType: "all",
    }),
    queryClient.invalidateQueries({
      queryKey: ["room-bookmarks", rid],
      refetchType: "all",
    }),
  ]);
}

export function useRoomBookmarks(
  roomId: string | null,
  categoryId: number | null,
) {
  const idOk =
    categoryId != null && Number.isFinite(categoryId) && categoryId >= 0;
  return useQuery({
    queryKey: roomBookmarksQueryKey(roomId, idOk ? categoryId : null),
    queryFn: () => getRoomBookmarks(roomId!, categoryId!),
    enabled: !!roomId && idOk,
    staleTime: 0,
  });
}

export function useCreateRoomBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      googlePlaceId,
      categoryId,
    }: {
      roomId: string;
      googlePlaceId: string;
      categoryId: number;
    }) => createRoomBookmark(roomId, { googlePlaceId, categoryId }),
    onSuccess: (_, { roomId, categoryId }) => {
      queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(roomId, categoryId),
      });
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
    },
  });
}

export function useMoveRoomBookmark() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      bookmarkId,
      categoryId,
    }: {
      roomId: string;
      bookmarkId: number;
      categoryId: number;
      fromCategoryId: number;
    }) => patchRoomBookmarkCategory(roomId, bookmarkId, { categoryId }),
    onSuccess: (_, { roomId, categoryId, fromCategoryId }) => {
      queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(roomId, fromCategoryId),
      });
      queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(roomId, categoryId),
      });
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
    },
  });
}

export function useDeleteRoomBookmarkItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roomId,
      bookmarkId,
      categoryId,
    }: {
      roomId: string;
      bookmarkId: number;
      categoryId: number;
    }) => deleteRoomBookmark(roomId, bookmarkId),
    onSuccess: (_, { roomId, categoryId }) => {
      queryClient.invalidateQueries({
        queryKey: roomBookmarksQueryKey(roomId, categoryId),
      });
      queryClient.invalidateQueries({
        queryKey: bookmarkCategoriesQueryKey(roomId),
      });
    },
  });
}
