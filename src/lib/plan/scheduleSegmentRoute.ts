import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import { getScheduleItemRoute } from "@/lib/api/rooms";
import { awaitScheduleRoutesBatch } from "@/lib/plan/schedule-bulk-hydration";
import { writeScheduleRouteToSessionStorage } from "@/lib/plan/planTravelLocalStorage";
import type { ScheduleTravelModeValue } from "@/lib/plan/scheduleTravelMode";
import { getQueryClient } from "@/lib/query-client";
import { scheduleItemRouteQueryKey } from "@/lib/query-keys";

/** `null` — 마지막 항목이거나 경로 없음(204) */
export type ScheduleSegmentRoute = ScheduleItemRouteResponse | null;

export type ResolveScheduleSegmentRouteArgs = {
  roomId: string;
  scheduleId: number;
  segmentSourceItemId: number;
  travelMode: ScheduleTravelModeValue;
  /** 일정 지문 — 비면 sessionStorage에 기록하지 않습니다. */
  scheduleFingerprint?: string;
};

const inFlightByRouteKey = new Map<string, Promise<ScheduleSegmentRoute>>();

/**
 * 구간 `(room, schedule, 출발 항목, 이동수단)`의 경로를 한 곳에서 해석합니다.
 * 거리·소요 시간과 지도 폴리라인이 같은 캐시 항목을 공유하도록, 일정 리스트와 지도 모두
 * 이 함수를 거칩니다.
 *
 * batch 완료 대기 → 구간 캐시 → 단건 GET 순으로 조회하며, GET 결과는 구간 캐시에 되써서
 * 먼저 도착한 쪽이 나머지 호출을 막습니다.
 */
export async function resolveScheduleSegmentRoute({
  roomId,
  scheduleId,
  segmentSourceItemId,
  travelMode,
  scheduleFingerprint,
}: ResolveScheduleSegmentRouteArgs): Promise<ScheduleSegmentRoute> {
  const rid = roomId.trim();
  if (!rid.length) return null;

  const routeKey = scheduleItemRouteQueryKey(
    rid,
    scheduleId,
    segmentSourceItemId,
    travelMode,
  );

  /** 저장 이동수단 기준 batch가 이 구간·수단을 시딩했을 수 있어 완료를 기다림 */
  await awaitScheduleRoutesBatch(rid, scheduleId);

  const qc = getQueryClient();
  if (qc) {
    const cached = qc.getQueryState<ScheduleSegmentRoute>(routeKey);
    if (cached?.data !== undefined && !cached.isInvalidated) {
      return cached.data;
    }
  }

  /** 리스트와 지도가 동시에 miss해도 GET은 한 번만 나가게 합침 */
  const dedupeKey = JSON.stringify(routeKey);
  const inFlight = inFlightByRouteKey.get(dedupeKey);
  if (inFlight) return inFlight;

  const promise = fetchAndSeed({
    rid,
    scheduleId,
    segmentSourceItemId,
    travelMode,
    scheduleFingerprint,
    routeKey,
  }).finally(() => {
    inFlightByRouteKey.delete(dedupeKey);
  });

  inFlightByRouteKey.set(dedupeKey, promise);
  return promise;
}

async function fetchAndSeed({
  rid,
  scheduleId,
  segmentSourceItemId,
  travelMode,
  scheduleFingerprint,
  routeKey,
}: {
  rid: string;
  scheduleId: number;
  segmentSourceItemId: number;
  travelMode: ScheduleTravelModeValue;
  scheduleFingerprint?: string;
  routeKey: ReturnType<typeof scheduleItemRouteQueryKey>;
}): Promise<ScheduleSegmentRoute> {
  const fresh = await getScheduleItemRoute(
    rid,
    scheduleId,
    segmentSourceItemId,
    travelMode,
  );

  getQueryClient()?.setQueryData(routeKey, fresh);

  const fp = scheduleFingerprint?.trim() ?? "";
  if (fp.length > 0) {
    writeScheduleRouteToSessionStorage(
      rid,
      scheduleId,
      segmentSourceItemId,
      travelMode,
      fp,
      fresh,
    );
  }

  return fresh;
}
