export const ROOMS_QUERY_KEY = ["rooms"] as const;

export function roomDetailQueryKey(roomId: string) {
  return ["room-detail", roomId] as const;
}

export function roomMembersQueryKey(roomId: string | null) {
  return ["room-members", roomId] as const;
}

export function joinRequestsQueryKey(roomId: string | null) {
  return ["join-requests", roomId] as const;
}
