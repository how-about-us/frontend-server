"use client";

import { useQuery } from "@tanstack/react-query";

import { getRoomDetail } from "@/lib/api/rooms";
import { roomDetailQueryKey } from "@/lib/query-keys";

export function useRoomDetail(roomId: string | null) {
  const id = typeof roomId === "string" ? roomId.trim() : "";
  return useQuery({
    queryKey: roomDetailQueryKey(id),
    queryFn: () => getRoomDetail(id),
    enabled: id.length > 0,
  });
}
