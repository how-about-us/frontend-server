import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import { getScheduleItemRoute } from "@/lib/api/rooms";
import type { PlanPlace } from "@/lib/plan/types";
import {
  canonicalScheduleTravelMode,
  type ScheduleTravelModeValue,
} from "@/lib/plan/scheduleTravelMode";

function roundCoord(n: number): string {
  if (!Number.isFinite(n)) return "";
  return n.toFixed(6);
}

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

/**
 * 일정 지문 — `itemId` 순서와 장소 정체성(Place ID·좌표)을 포함해
 * 순서만 같고 장소만 바뀐 경우에도 LS·경로 캐시가 엇나가지 않게 합니다.
 */
export function schedulePlacesFingerprint(places: PlanPlace[]): string {
  const parts: string[] = [];
  for (const p of places) {
    if (typeof p.itemId !== "number" || !Number.isFinite(p.itemId)) continue;
    const gid = (p.googlePlaceId ?? "").trim();
    const lat = p.location?.lat;
    const lng = p.location?.lng;
    const loc =
      typeof lat === "number" &&
      typeof lng === "number" &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
        ? `${roundCoord(lat)},${roundCoord(lng)}`
        : "";
    parts.push(`${p.itemId}:${gid}:${loc}`);
  }
  return parts.join("|");
}

/** 해당 일차 경로·이동수단 LS 항목 일괄 제거 */
export function clearPersistedScheduleRoutesForSchedule(
  roomId: string,
  scheduleId: number,
): void {
  if (typeof window === "undefined") return;
  const rid = roomId.trim();
  if (!rid.length) return;
  const prefixRoute = `${NS_ROUTE}:${rid}:${scheduleId}:`;
  const prefixMode = `${NS_MODE}:${rid}:${scheduleId}:`;
  const toRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith(prefixRoute) || k.startsWith(prefixMode)) {
      toRemove.push(k);
    }
  }
  for (const k of toRemove) {
    try {
      localStorage.removeItem(k);
    } catch {
      /* quota */
    }
  }
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
