import type {
  OmitKeyof,
  QueryKey,
  UseQueryOptions,
} from "@tanstack/react-query";

import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import { getScheduleItemRoute } from "@/lib/api/rooms";
import { scheduleItemRouteQueryKey } from "@/lib/query-keys";
import {
  readScheduleRouteFromLocalStorage,
  writeScheduleRouteToLocalStorage,
} from "@/lib/plan/planTravelLocalStorage";
import type { ScheduleTravelModeValue } from "@/lib/plan/scheduleTravelMode";

type RouteCached = ScheduleItemRouteResponse | null;

/**
 * — `segmentReady`: 네트워크 패치·LS 시드 허용(`routeQueryEnabled`). 쿼리 키는 이것과 무관하게
 *   `(room, schedule, 구간, 모드)`로 고정 — 일정 refetch 중 잠깐 false가 되어도 구간끼리 캐시를 공유하지 않음
 * — `networkEnabled` 생략 시 `segmentReady`와 동일; 지연 수단은 메뉴 열림 시만 `true`
 */
export type PersistedScheduleRoutePersistFlags = {
  /** 일정·구간 준비 전에는 패치·LS 시드 차단 — `routeQueryEnabled` */
  segmentReady: boolean;
  /** 널이면 `segmentReady`와 동일 — 지연 수단만 false로 메뉴 닫힘 시 패치 차단 */
  networkEnabled?: boolean;
};

/** `GET …/route?travelMode=…` — LS(`scheduleFingerprint` 일치) ↔ React Query */
export function persistedScheduleItemRouteQueryOptions(
  roomIdTrimmed: string,
  scheduleId: number | null,
  segmentSourceItemId: number | null,
  travelMode: ScheduleTravelModeValue,
  fingerprintTrimmed: string,
  flags: PersistedScheduleRoutePersistFlags,
): OmitKeyof<
  UseQueryOptions<RouteCached, Error, RouteCached, QueryKey>,
  "queryKey"
> & { queryKey: ReturnType<typeof scheduleItemRouteQueryKey> } {
  const rid = roomIdTrimmed.trim();
  const sid = scheduleId;
  const sidOk = typeof sid === "number" && Number.isFinite(sid);
  const itemOk =
    typeof segmentSourceItemId === "number" &&
    Number.isFinite(segmentSourceItemId);
  const fp = fingerprintTrimmed.trim();

  const keyEligible =
    flags.segmentReady && rid.length > 0 && sidOk && itemOk;

  const network =
    typeof flags.networkEnabled === "boolean"
      ? flags.networkEnabled
      : flags.segmentReady;

  const enabled = keyEligible && network;

  const keyRoom = rid.length > 0 ? rid : null;
  const keySchedule = sidOk ? sid : null;
  const keySegment = itemOk ? segmentSourceItemId : null;
  const keyMode =
    sidOk && itemOk && rid.length > 0 ? travelMode : null;

  const lsSeed: RouteCached | undefined =
    fp.length > 0 &&
    typeof window !== "undefined" &&
    keyEligible &&
    rid.length > 0
      ? readScheduleRouteFromLocalStorage(
          rid,
          sid!,
          segmentSourceItemId!,
          travelMode,
          fp,
        )
      : undefined;

  return {
    queryKey: scheduleItemRouteQueryKey(
      keyRoom,
      keySchedule,
      keySegment,
      keyMode,
    ),
    ...(lsSeed !== undefined
      ? {
          initialData: lsSeed,
          initialDataUpdatedAt: typeof window !== "undefined" ? Date.now() : 0,
        }
      : {}),
    queryFn: async (): Promise<RouteCached> => {
      const fresh = await getScheduleItemRoute(
        rid,
        sid!,
        segmentSourceItemId!,
        travelMode,
      );
      if (fp.length > 0 && sidOk && itemOk) {
        writeScheduleRouteToLocalStorage(
          rid,
          sid!,
          segmentSourceItemId!,
          travelMode,
          fp,
          fresh,
        );
      }
      return fresh;
    },
    enabled,
    /** 순수 로컬 캐시에만 의존하지 않도록 주기적으로 서버 재검증 */
    staleTime: 1000 * 60 * 60 * 6,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: false,
  };
}
