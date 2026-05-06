import { apiUrl, jsonBody, requestJson, requestVoid } from "@/lib/api/http";
import { eachInclusiveTripDay } from "@/lib/plan/tripRange";

export type RoomSchedule = {
  scheduleId: number;
  roomId: string;
  dayNumber: number;
  /** `YYYY-MM-DD` */
  date: string;
  createdAt: string;
};

export type RoomScheduleCreateRequest = {
  dayNumber: number;
  /** `YYYY-MM-DD` */
  date: string;
};

export async function createRoomSchedule(
  roomId: string,
  body: RoomScheduleCreateRequest,
): Promise<RoomSchedule> {
  return requestJson(
    apiUrl(`/rooms/${roomId}/schedules`),
    { method: "POST", ...jsonBody(body) },
    { errorMessage: "일정 생성 실패" },
  );
}

export async function getRoomSchedules(roomId: string): Promise<RoomSchedule[]> {
  return requestJson(apiUrl(`/rooms/${roomId}/schedules`), undefined, {
    errorMessage: "일정 목록 조회 실패",
  });
}

export async function deleteRoomSchedule(
  roomId: string,
  scheduleId: number,
): Promise<void> {
  return requestVoid(
    apiUrl(`/rooms/${roomId}/schedules/${scheduleId}`),
    { method: "DELETE" },
    { errorMessage: "일정 삭제 실패" },
  );
}

/** 방 기간(포함)마다 `POST /rooms/{roomId}/schedules`를 호출해 서버 일정을 초기화합니다. */
export async function seedRoomSchedules(
  roomId: string,
  startDate: string,
  endDate: string,
): Promise<void> {
  const days = eachInclusiveTripDay(startDate, endDate);
  await Promise.all(
    days.map(({ date, dayNumber }) =>
      createRoomSchedule(roomId, { dayNumber, date }),
    ),
  );
}
