import { apiUrl, jsonBody, requestJson, requestVoid } from "@/lib/api/http";
import type { RoomMemberListResponse } from "./types";

export async function getRoomMembers(
  roomId: string,
): Promise<RoomMemberListResponse> {
  return requestJson(apiUrl(`/rooms/${roomId}/members`), undefined, {
    errorMessage: "멤버 목록 조회 실패",
  });
}

export async function transferHost(
  roomId: string,
  targetUserId: number,
): Promise<void> {
  return requestVoid(
    apiUrl(`/rooms/${roomId}/host`),
    { method: "PATCH", ...jsonBody({ targetUserId }) },
    { errorMessage: "방장 위임 실패", useHttpError: true },
  );
}

export async function leaveRoom(roomId: string): Promise<void> {
  return requestVoid(
    apiUrl(`/rooms/${roomId}/members/me`),
    { method: "DELETE" },
    { errorMessage: "방 나가기 실패", useHttpError: true },
  );
}

export async function kickMember(
  roomId: string,
  userId: number,
): Promise<void> {
  return requestVoid(
    apiUrl(`/rooms/${roomId}/members/${userId}`),
    { method: "DELETE" },
    { errorMessage: "멤버 추방 실패", useHttpError: true },
  );
}
