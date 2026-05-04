import type {
  OmitKeyof,
  QueryKey,
  UseQueryOptions,
} from "@tanstack/react-query";

import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import { getScheduleItemRoute } from "@/lib/api/rooms";
import { scheduleItemRouteQueryKey } from "@/lib/queryKeys/scheduleRoutes";
import {
  readScheduleRouteFromLocalStorage,
  writeScheduleRouteToLocalStorage,
} from "@/lib/plan/planTravelLocalStorage";
import type { ScheduleTravelModeValue } from "@/lib/plan/scheduleTravelMode";

type RouteCached = ScheduleItemRouteResponse | null;

/**
 * — `segmentReady`: 구간 키·LS 시드에 참여(`routeQueryEnabled`)
 * — `networkEnabled` 생략 시 `segmentReady`와 동일; 지연 수단은 메뉴 열림 시만 `true`
 */
export type PersistedScheduleRoutePersistFlags = {
  /** 일정·구간 패치 허용(키·LS 동시) — `routeQueryEnabled` */
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
      rid || null,
      keyEligible ? sid : null,
      keyEligible ? segmentSourceItemId : null,
      keyEligible ? travelMode : null,
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
      if (fp.length > 0 && sidOk && itemOk && keyEligible) {
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
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: false,
  };
}
