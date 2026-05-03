import { apiFetch } from "@/lib/api/client";
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

export type UpdateTravelModeRequest = {
  /** `DRIVING` | `WALKING` | `BICYCLING` | `TRANSIT` */
  travelMode: string;
};

/** @deprecated 명세 이름은 {@link UpdateTravelModeRequest} */
export type UpdateScheduleItemTravelModeRequest = UpdateTravelModeRequest;

/** GET …/route — 현재 항목 → 다음 항목 구간 */
export type ScheduleItemRouteResponse = {
  distanceMeters: number;
  durationSeconds: number;
  travelMode: string;
};

export async function getScheduleItemRoute(
  roomId: string,
  scheduleId: number,
  /** 구간 시작(현재) 일정 항목 ID — 명세상 ‘현재 항목에서 다음 항목으로’ */
  itemId: number,
  travelMode?: string | null,
): Promise<ScheduleItemRouteResponse | null> {
  const params = new URLSearchParams();
  const tm =
    typeof travelMode === "string" && travelMode.trim().length > 0
      ? travelMode.trim()
      : null;
  if (tm) params.set("travelMode", tm);
  const qs = params.toString();
  const path = `/rooms/${roomId}/schedules/${scheduleId}/items/${itemId}/route${qs ? `?${qs}` : ""}`;
  const res = await apiFetch(apiUrl(path), undefined);
  if (res.status === 204) {
    return null;
  }
  /**
   * 외부 경로 API가 구간·수단 조합 미제공 시 백엔드가 502 등으로 감싸 오는 경우가 있어,
   * 앱에서는 ‘안내 데이터 없음’으로 취급한다(네트워크 탭에는 응답이 그대로 남음).
   */
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`이동 정보 조회 실패: ${res.status}`);
  }
  return res.json() as Promise<ScheduleItemRouteResponse>;
}

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

export async function updateScheduleItemTravelMode(
  roomId: string,
  scheduleId: number,
  itemId: number,
  body: UpdateTravelModeRequest,
): Promise<RoomScheduleItem> {
  return requestJson(
    apiUrl(
      `/rooms/${roomId}/schedules/${scheduleId}/items/${itemId}/travel-mode`,
    ),
    { method: "PATCH", ...jsonBody(body) },
    { errorMessage: "이동 수단 변경 실패" },
  );
}
