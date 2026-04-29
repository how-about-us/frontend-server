import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  approveJoinRequest,
  createRoom,
  deleteRoom,
  getJoinRequests,
  getJoinStatus,
  getRoomMembers,
  getRooms,
  joinRoom,
  regenerateInviteCode,
  rejectJoinRequest,
  RoomCreateRequest,
  RoomUpdateRequest,
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
    mutationFn: ({ roomId, data }: { roomId: string; data: RoomUpdateRequest }) =>
      updateRoom(roomId, data),
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

export const JOIN_REQUESTS_QUERY_KEY = (roomId: string) =>
  ["join-requests", roomId] as const;

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
