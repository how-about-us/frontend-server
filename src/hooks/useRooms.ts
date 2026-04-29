import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createRoom,
  deleteRoom,
  getRooms,
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
