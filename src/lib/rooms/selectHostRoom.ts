import type { RoomListItem } from "@/lib/api/rooms/types";

export type SelectHostRoomStrategy = "anyHostedRoom" | "currentRoomHostOnly";

export function isHostRole(role: string | undefined | null): boolean {
  if (typeof role !== "string") return false;
  return role.toUpperCase() === "HOST";
}

/**
 * 입장 요청(join-requests) 등 호스트 전용 API와 맞춰 쓸 방 선택.
 * - `anyHostedRoom`: 현재 방이 호스트면 그 방, 아니면 목록에서 첫 호스트 방(배지·설정용).
 * - `currentRoomHostOnly`: 현재 선택 방에서만 호스트일 때만 해당 방(멤버로 보고 있을 때 불필요한 GET 방지).
 */
export function selectHostRoom(
  rooms: RoomListItem[] | undefined,
  currentRoomId: string | null | undefined,
  strategy: SelectHostRoomStrategy,
): RoomListItem | undefined {
  if (!rooms?.length) return undefined;

  const inCurrent =
    currentRoomId != null && String(currentRoomId).trim() !== ""
      ? rooms.find(
          (r) => r.id === currentRoomId && isHostRole(r.role),
        )
      : undefined;

  if (strategy === "currentRoomHostOnly") {
    return inCurrent;
  }

  return inCurrent ?? rooms.find((r) => isHostRole(r.role));
}
