import { apiUrl, jsonBody, requestJson, requestVoid } from "@/lib/api/http";

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
  /** 로컬 시:분, 예: `"09:45"` */
  startTime: string;
  durationMinutes: number;
};

export type RoomScheduleItemUpdateRequest = {
  startTime: string;
  durationMinutes: number;
};

export type ReorderScheduleItemRequest = {
  newOrderIndex: number;
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

export async function updateScheduleItem(
  roomId: string,
  scheduleId: number,
  itemId: number,
  body: RoomScheduleItemUpdateRequest,
): Promise<RoomScheduleItem> {
  return requestJson(
    apiUrl(`/rooms/${roomId}/schedules/${scheduleId}/items/${itemId}`),
    { method: "PATCH", ...jsonBody(body) },
    { errorMessage: "체류 시간 수정 실패" },
  );
}

export async function deleteScheduleItem(
  roomId: string,
  scheduleId: number,
  itemId: number,
): Promise<void> {
  return requestVoid(
    apiUrl(`/rooms/${roomId}/schedules/${scheduleId}/items/${itemId}`),
    { method: "DELETE" },
    { errorMessage: "일정 장소 삭제 실패" },
  );
}

export async function reorderScheduleItem(
  roomId: string,
  scheduleId: number,
  itemId: number,
  body: ReorderScheduleItemRequest,
): Promise<RoomScheduleItem[]> {
  return requestJson(
    apiUrl(`/rooms/${roomId}/schedules/${scheduleId}/items/${itemId}/order`),
    { method: "PATCH", ...jsonBody(body) },
    { errorMessage: "일정 순서 변경 실패" },
  );
}
