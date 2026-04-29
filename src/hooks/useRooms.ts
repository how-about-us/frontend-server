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
  kickMember,
  leaveRoom,
  regenerateInviteCode,
  rejectJoinRequest,
  RoomCreateRequest,
  RoomUpdateRequest,
  transferHost,
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
