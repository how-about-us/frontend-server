import { apiFetch } from "@/lib/api/client";
import { apiUrl, jsonBody, requestJson, requestVoid } from "@/lib/api/http";

export type RoomScheduleItem = {
  itemId: number;
  scheduleId: number;
  googlePlaceId: string;
  startTime: string;
  durationMinutes: number;
  memo?: string;
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
  startTime?: string;
  durationMinutes?: number;
  /** 키를 내면 서버가 갱신. 빈 문자열이면 삭제 */
  memo?: string | null;
};

export type ReorderScheduleItemRequest = {
  newOrderIndex: number;
};

export type MoveScheduleItemToScheduleRequest = {
  targetScheduleId: number;
  targetOrderIndex: number;
};

/** GET …/route — 현재 항목 → 다음 항목 구간 단일 레그 */
export type ScheduleItemRouteLeg = {
  distanceMeters: number;
  durationSeconds: number;
  travelMode: string;
};

/**
 * travelMode 미지정 조회 시 본문에 수단별 배열을 함께 줄 수 있습니다.
 */
export type ScheduleItemRouteResponse = ScheduleItemRouteLeg & {
  routes?: ScheduleItemRouteLeg[];
  modeRoutes?: ScheduleItemRouteLeg[];
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
  // 경로 안내 없음: 서버는 204 No Content (본문 없음)
  if (res.status === 204) {
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
    { errorMessage: "일정 항목 수정 실패" },
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

export async function moveScheduleItemToSchedule(
  roomId: string,
  sourceScheduleId: number,
  itemId: number,
  body: MoveScheduleItemToScheduleRequest,
): Promise<RoomScheduleItem> {
  return requestJson(
    apiUrl(
      `/rooms/${roomId}/schedules/${sourceScheduleId}/items/${itemId}/move`,
    ),
    { method: "PATCH", ...jsonBody(body) },
    { errorMessage: "일정 항목 이동 실패" },
  );
}
