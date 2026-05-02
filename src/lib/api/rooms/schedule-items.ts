import { apiUrl, jsonBody, requestJson } from "@/lib/api/http";

export type RoomScheduleItem = {
  itemId: number;
  scheduleId: number;
  googlePlaceId: string;
  startTime: string;
  durationMinutes: number;
  orderIndex: number;
  travelMode: string;
  createdAt: string;
};

export type RoomScheduleItemCreateRequest = {
  googlePlaceId: string;
  startTime: string;
  durationMinutes: number;
};

export async function getScheduleItems(
  roomId: string,
  scheduleId: number,
): Promise<RoomScheduleItem[]> {
  return requestJson(
    apiUrl(`/rooms/${roomId}/schedules/${scheduleId}/items`),
    undefined,
    { errorMessage: "일정 장소 목록 조회 실패" },
  );
}

export async function createScheduleItem(
  roomId: string,
  scheduleId: number,
  body: RoomScheduleItemCreateRequest,
): Promise<RoomScheduleItem> {
  return requestJson(
    apiUrl(`/rooms/${roomId}/schedules/${scheduleId}/items`),
    { method: "POST", ...jsonBody(body) },
    { errorMessage: "일정 장소 추가 실패" },
  );
}
