import { apiUrl, jsonBody, requestJson, requestVoid } from "@/lib/api/http";
import type { JoinRequestListResponse, JoinRoomResponse } from "./types";

export async function getJoinStatus(roomId: string): Promise<JoinRoomResponse> {
  return requestJson(
    apiUrl(`/rooms/${roomId}/join/status`),
    undefined,
    { errorMessage: "입장 상태 조회 실패", useHttpError: true },
  );
}

export async function joinRoom(inviteCode: string): Promise<JoinRoomResponse> {
  return requestJson(apiUrl("/rooms/join"), {
    method: "POST",
    ...jsonBody({ inviteCode }),
  }, { errorMessage: "입장 요청 실패" });
}

export async function getJoinRequests(
  roomId: string,
): Promise<JoinRequestListResponse> {
  return requestJson(apiUrl(`/rooms/${roomId}/join-requests`), undefined, {
    errorMessage: "입장 요청 목록 조회 실패",
  });
}

export async function approveJoinRequest(
  roomId: string,
  requestId: number,
): Promise<void> {
  return requestVoid(
    apiUrl(`/rooms/${roomId}/join-requests/${requestId}/approve`),
    { method: "POST" },
    { errorMessage: "입장 승인 실패" },
  );
}

export async function rejectJoinRequest(
  roomId: string,
  requestId: number,
): Promise<void> {
  return requestVoid(
    apiUrl(`/rooms/${roomId}/join-requests/${requestId}/reject`),
    { method: "POST" },
    { errorMessage: "입장 거절 실패" },
  );
}
