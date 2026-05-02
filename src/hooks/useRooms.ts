import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveJoinRequest,
  createBookmarkCategory,
  createRoomBookmark,
  createRoom,
  deleteRoomBookmark,
  deleteBookmarkCategory,
  deleteRoom,
  getBookmarkCategories,
  getJoinRequests,
  getJoinStatus,
  getRoomBookmarks,
  getRoomMembers,
  patchRoomBookmarkCategory,
  getRooms,
  joinRoom,
  kickMember,
  leaveRoom,
  regenerateInviteCode,
  rejectJoinRequest,
  RoomCreateRequest,
  RoomUpdateRequest,
  transferHost,
  updateBookmarkCategory,
  updateRoom,
} from "@/lib/api/rooms";

export const ROOMS_QUERY_KEY = ["rooms"] as const;

export function useRoomsList() {
  return useQuery({
    queryKey: ROOMS_QUERY_KEY,
    queryFn: () => getRooms(),
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RoomCreateRequest) => createRoom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY });
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
