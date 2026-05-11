import type { JoinRoomResponse } from "@/lib/api/rooms/types";

const APPROVED_ALIASES = new Set(["APPROVED", "JOINED", "ACCEPTED"]);
const REJECTED_ALIASES = new Set(["REJECTED", "REJECT", "DENIED", "DECLINED"]);

export function isJoinApprovedStatus(normalizedUpper: string): boolean {
  if (!normalizedUpper) return false;
  return APPROVED_ALIASES.has(normalizedUpper.toUpperCase());
}

/** 대기 페이지에서 결과 배지용 (PENDING / APPROVED / REJECTED) */
export type JoinWaitingUiStatus = "PENDING" | "APPROVED" | "REJECTED";

export function joinStatusForWaitingUi(
  payload: JoinRoomResponse,
): JoinWaitingUiStatus {
  const s =
    typeof payload.status === "string" ? payload.status.trim() : "";
  const upper = s.toUpperCase();
  if (isJoinApprovedStatus(upper)) return "APPROVED";
  if (REJECTED_ALIASES.has(upper)) return "REJECTED";
  if (upper) return "PENDING";
  return "PENDING";
}

export function planPathForRoom(roomId: string): string {
  const id = roomId.trim();
  return id.length > 0 ? `/plan/${encodeURIComponent(id)}` : "/plan";
}
