import type { QueryClient } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api/client";
import type {
  RoomDetail,
  RoomListItem,
  RoomListResponse,
  RoomSchedule,
} from "@/lib/api/rooms";
import { getRoomDetail, getRoomSchedules } from "@/lib/api/rooms";
import { apiUrl } from "@/lib/api/http";
import { clearPersistedScheduleRoutesForSchedule } from "@/lib/plan/planTravelLocalStorage";
import { sortRoomSchedules } from "@/lib/plan/scheduleMerge";
import type { PlanPlace } from "@/lib/plan/types";
import {
  ROOMS_QUERY_KEY,
  roomDetailQueryKey,
  roomSchedulesQueryKey,
  scheduleItemsQueryKey,
} from "@/lib/query-keys";

/** 일차 삭제 후 route·items 쿼리 캐시 제거 (삭제된 scheduleId에 대한 GET 방지) */
export function removeCachesForDeletedSchedule(
  queryClient: QueryClient,
  roomId: string,
  scheduleId: number,
): void {
  const rid = roomId.trim();
  if (!rid.length) return;

  clearPersistedScheduleRoutesForSchedule(rid, scheduleId);

  queryClient.removeQueries({
    predicate: (q) => {
      const key = q.queryKey;
      if (!Array.isArray(key) || key[0] !== "schedule-item-route") {
        return false;
      }
      if (String(key[1] ?? "").trim() !== rid) return false;
      return key[2] === scheduleId;
    },
  });
  queryClient.removeQueries({
    queryKey: scheduleItemsQueryKey(rid, scheduleId),
  });
}

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
      ? rooms.find((r) => r.id === currentRoomId && isHostRole(r.role))
      : undefined;

  if (strategy === "currentRoomHostOnly") {
    return inCurrent;
  }

  return inCurrent ?? rooms.find((r) => isHostRole(r.role));
}

/**
 * `GET /rooms/{roomId}/schedules`로 서버 일정을 가져와 React Query 캐시에 넣습니다.
 * 방 생성(서버 시딩) 직후 플랜 첫 진입 시 빈 목록·레이스를 줄입니다.
 */
export async function hydrateRoomSchedulesFromServer(
  queryClient: QueryClient,
  roomId: string,
): Promise<RoomSchedule[]> {
  const rid = roomId.trim();
  if (!rid.length) return [];

  const schedules = await queryClient.fetchQuery({
    queryKey: roomSchedulesQueryKey(rid),
    queryFn: () => getRoomSchedules(rid),
  });
  const sorted = sortRoomSchedules(schedules);
  queryClient.setQueryData<RoomSchedule[]>(
    roomSchedulesQueryKey(rid),
    sorted,
  );
  for (const s of sorted) {
    queryClient.setQueryData<PlanPlace[]>(
      scheduleItemsQueryKey(rid, s.scheduleId),
      [],
    );
  }
  return sorted;
}

/** `GET /rooms/{roomId}` 결과로 room-detail·방 목록 캐시를 맞춥니다. */
export async function syncRoomDetailFromServer(
  queryClient: QueryClient,
  roomId: string,
): Promise<void> {
  const rid = roomId.trim();
  if (!rid.length) return;
  let detail: RoomDetail;
  try {
    detail = await getRoomDetail(rid);
  } catch {
    return;
  }
  queryClient.setQueryData<RoomDetail>(roomDetailQueryKey(rid), detail);
  queryClient.setQueryData<RoomListResponse>(ROOMS_QUERY_KEY, (prev) => {
    if (!prev) return prev;
    return {
      ...prev,
      rooms: prev.rooms.map((r) =>
        r.id === rid
          ? {
              ...r,
              title: detail.title,
              destination: detail.destination,
              startDate: detail.startDate,
              endDate: detail.endDate,
            }
          : r,
      ),
    };
  });
}

export type RoomAccessVerdict = "ok" | "forbidden" | "error";

/**
 * Persist된 `currentRoomId` 등이 서버에서 여전히 유효한지 확인합니다.
 * 네트워크 오류 등은 `"error"`로 두고 스토어는 건드리지 않습니다.
 */
const VALIDATE_ROOM_ACCESS_FORBIDDEN_RETRIES = 3;
const VALIDATE_ROOM_ACCESS_RETRY_BASE_MS = 400;

/** 승인 직후 `GET /rooms/:id` 일시 403 등과의 레이스를 줄이기 위해 forbidden 시 짧게 재시도합니다. */
export async function validateRoomAccess(
  roomId: string,
): Promise<RoomAccessVerdict> {
  const rid = roomId.trim();
  if (!rid.length) return "error";

  const delayAfterAttempt = async (attempt: number) => {
    if (attempt < VALIDATE_ROOM_ACCESS_FORBIDDEN_RETRIES - 1) {
      await new Promise((r) =>
        setTimeout(r, VALIDATE_ROOM_ACCESS_RETRY_BASE_MS * (attempt + 1)),
      );
    }
  };

  for (let attempt = 0; attempt < VALIDATE_ROOM_ACCESS_FORBIDDEN_RETRIES; attempt++) {
    try {
      const res = await apiFetch(apiUrl(`/rooms/${rid}`));
      if (res.ok) return "ok";
      if (res.status === 403 || res.status === 404) {
        if (attempt < VALIDATE_ROOM_ACCESS_FORBIDDEN_RETRIES - 1) {
          await delayAfterAttempt(attempt);
          continue;
        }
        return "forbidden";
      }
      return "error";
    } catch {
      await delayAfterAttempt(attempt);
    }
  }
  return "error";
}
