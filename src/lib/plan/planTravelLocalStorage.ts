import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import { getScheduleItemRoute } from "@/lib/api/rooms";
import {
  canonicalScheduleTravelMode,
  type ScheduleTravelModeValue,
} from "@/lib/plan/scheduleTravelMode";

const NS_ROUTE = "hau:plan:route:v1";
const NS_MODE = "hau:plan:travelMode:v1";

function routeStorageKey(
  roomId: string,
  scheduleId: number,
  segmentSourceItemId: number,
  travelMode: string,
): string {
  return `${NS_ROUTE}:${roomId.trim()}:${scheduleId}:${segmentSourceItemId}:${travelMode.trim()}`;
}

function modeStorageKey(
  roomId: string,
  scheduleId: number,
  segmentSourceItemId: number,
): string {
  return `${NS_MODE}:${roomId.trim()}:${scheduleId}:${segmentSourceItemId}`;
}

type PersistedRouteV1 = {
  fp: string;
  kind: "empty" | "data";
  body?: ScheduleItemRouteResponse;
};

type PersistedModeV1 = {
  fp: string;
  mode: string;
};

function routeBodyOk(
  b: unknown,
): b is ScheduleItemRouteResponse {
  if (!b || typeof b !== "object") return false;
  const o = b as Record<string, unknown>;
  return (
    typeof o.distanceMeters === "number" &&
    typeof o.durationSeconds === "number" &&
    typeof o.travelMode === "string"
  );
}

/** 현재 일정에 대한 지문 — 항목 추가·삭제·순서 변경 시 바뀌며 LS·쿼리 캐시 무효에 사용 */
export function schedulePlacesFingerprint(orderedItemIds: number[]): string {
  return orderedItemIds.join(",");
}

/**
 * @returns `undefined` — 캐시 없음/불일치
 * @returns `null` — LS에 “경로 없음(204)”이 저장됨
 */
export function readScheduleRouteFromLocalStorage(
  roomId: string,
  scheduleId: number,
  segmentSourceItemId: number,
  travelMode: string,
  expectedFp: string,
): ScheduleItemRouteResponse | null | undefined {
  if (typeof window === "undefined" || !expectedFp) return undefined;
  try {
    const raw = localStorage.getItem(
      routeStorageKey(roomId, scheduleId, segmentSourceItemId, travelMode),
    );
    if (!raw) return undefined;
    const o = JSON.parse(raw) as PersistedRouteV1;
    if (o.fp !== expectedFp) return undefined;
    if (o.kind === "empty") return null;
    if (o.kind === "data" && routeBodyOk(o.body)) return o.body;
    return undefined;
  } catch {
    return undefined;
  }
}

export function writeScheduleRouteToLocalStorage(
  roomId: string,
  scheduleId: number,
  segmentSourceItemId: number,
  travelMode: string,
  fp: string,
  data: ScheduleItemRouteResponse | null,
): void {
  if (typeof window === "undefined" || !fp) return;
  try {
    const key = routeStorageKey(
      roomId,
      scheduleId,
      segmentSourceItemId,
      travelMode,
    );
    if (data === null) {
      localStorage.setItem(
        key,
        JSON.stringify({ fp, kind: "empty" } satisfies PersistedRouteV1),
      );
    } else {
      localStorage.setItem(
        key,
        JSON.stringify({
          fp,
          kind: "data",
          body: data,
        } satisfies PersistedRouteV1),
      );
    }
  } catch {
    /* quota / private mode */
  }
}

export async function getScheduleItemRoutePersisted(
  roomId: string,
  scheduleId: number,
  segmentSourceItemId: number,
  travelMode: string,
  fp: string,
): Promise<ScheduleItemRouteResponse | null> {
  const tm = travelMode.trim();
  if (!fp) {
    return getScheduleItemRoute(
      roomId,
      scheduleId,
      segmentSourceItemId,
      tm,
    );
  }
  const cached = readScheduleRouteFromLocalStorage(
    roomId,
    scheduleId,
    segmentSourceItemId,
    tm,
    fp,
  );
  if (cached !== undefined) {
    return cached;
  }

  const fresh = await getScheduleItemRoute(
    roomId,
    scheduleId,
    segmentSourceItemId,
    tm,
  );
  writeScheduleRouteToLocalStorage(
    roomId,
    scheduleId,
    segmentSourceItemId,
    tm,
    fp,
    fresh,
  );
  return fresh;
}

export function readTravelModeFromLocalStorage(
  roomId: string,
  scheduleId: number,
  segmentSourceItemId: number,
  expectedFp: string,
): ScheduleTravelModeValue | undefined {
  if (typeof window === "undefined" || !expectedFp) return undefined;
  try {
    const raw = localStorage.getItem(
      modeStorageKey(roomId, scheduleId, segmentSourceItemId),
    );
    if (!raw) return undefined;
    const o = JSON.parse(raw) as PersistedModeV1;
    if (o.fp !== expectedFp) return undefined;
    const c = canonicalScheduleTravelMode(
      typeof o.mode === "string" ? o.mode.trim() : undefined,
    );
    return c ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeTravelModeToLocalStorage(
  roomId: string,
  scheduleId: number,
  segmentSourceItemId: number,
  fp: string,
  mode: ScheduleTravelModeValue,
): void {
  if (typeof window === "undefined" || !fp) return;
  try {
    localStorage.setItem(
      modeStorageKey(roomId, scheduleId, segmentSourceItemId),
      JSON.stringify({
        fp,
        mode,
      } satisfies PersistedModeV1),
    );
  } catch {
    /* quota */
  }
}
