"use client";

import { useQueries } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import { useScheduleItemRoute } from "@/hooks/useRooms";
import { persistedScheduleItemRouteQueryOptions } from "@/lib/plan/scheduleItemRoutePersistedQuery";
import { buildScheduleItemRouteSummariesByMode } from "@/lib/plan/scheduleItemRouteModes";
import {
  SCHEDULE_ROUTE_DEFERRED_FETCH_MODES,
  SCHEDULE_ROUTE_PRIMARY_FETCH_MODE,
  canonicalScheduleTravelMode,
  type ScheduleTravelModeValue,
} from "@/lib/plan/scheduleTravelMode";
import { PLAN_ROUTE_CARD_WIDTH_PX } from "@/lib/layout-tokens";
import { cn } from "@/lib/utils";

import { PlanTravelTimeCollapsed } from "./PlanTravelTimeCollapsed";
import { TravelDirectionsCard } from "./TravelDirectionsCard";
import { TravelRouteRail } from "./TravelRouteRail";

function routePayloadOk(
  r: ScheduleItemRouteResponse | null | undefined,
): r is ScheduleItemRouteResponse {
  return (
    r != null &&
    r.durationSeconds >= 0 &&
    r.distanceMeters >= 0
  );
}

/** 플랜 구간 경로는 항상 자동차 기준으로 표시·적용, 다른 수단은 패널에서 참고만 */
const FIXED_TRAVEL_MODE = SCHEDULE_ROUTE_PRIMARY_FETCH_MODE;

export type PlanTravelTimeProps = {
  roomId: string;
  scheduleId: number;
  segmentSourceItemId: number;
  scheduleFingerprint: string;
  travelMode?: string;
  routeQueryEnabled?: boolean;
  className?: string;
};

export function PlanTravelTime({
  roomId,
  scheduleId,
  segmentSourceItemId,
  scheduleFingerprint,
  routeQueryEnabled = true,
  className,
}: PlanTravelTimeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [directionsHidden, setDirectionsHidden] = useState(false);

  const fpTrim = scheduleFingerprint.trim();
  const rid = roomId.trim();

  const {
    data: drivingRoute,
    isPending: drivingPending,
    isError: drivingError,
    isFetching: drivingFetching,
  } = useScheduleItemRoute(
    roomId,
    scheduleId,
    segmentSourceItemId,
    FIXED_TRAVEL_MODE,
    routeQueryEnabled,
    fpTrim,
  );

  const deferredLazyEnabled =
    routeQueryEnabled &&
    menuOpen &&
    rid.length > 0 &&
    Number.isFinite(scheduleId) &&
    Number.isFinite(segmentSourceItemId);

  const deferredRouteQueries = useQueries({
    queries: SCHEDULE_ROUTE_DEFERRED_FETCH_MODES.map((mode) =>
      persistedScheduleItemRouteQueryOptions(
        rid,
        scheduleId,
        segmentSourceItemId,
        mode,
        fpTrim,
        {
          segmentReady: routeQueryEnabled,
          networkEnabled: deferredLazyEnabled,
        },
      ),
    ),
  });

  const deferredD0 = deferredRouteQueries[0]?.data;
  const deferredD1 = deferredRouteQueries[1]?.data;
  const deferredD2 = deferredRouteQueries[2]?.data;

  const modeRouteSummaries = useMemo(() => {
    const merged =
      buildScheduleItemRouteSummariesByMode(drivingRoute ?? undefined);

    const apply = (
      payload: ScheduleItemRouteResponse | null | undefined,
    ): void => {
      if (!routePayloadOk(payload)) return;
      const cm = canonicalScheduleTravelMode(
        typeof payload.travelMode === "string"
          ? payload.travelMode.trim()
          : "",
      );
      if (!cm) return;
      merged[cm] = {
        durationSeconds: payload.durationSeconds,
        distanceMeters: payload.distanceMeters,
      };
    };

    apply(drivingRoute);
    apply(deferredD0);
    apply(deferredD1);
    apply(deferredD2);

    return merged;
  }, [drivingRoute, deferredD0, deferredD1, deferredD2]);

  const displayRoute = useMemo(() => {
    const sel = modeRouteSummaries[FIXED_TRAVEL_MODE];
    if (
      sel != null &&
      sel.durationSeconds >= 0 &&
      sel.distanceMeters >= 0
    ) {
      return {
        travelMode: FIXED_TRAVEL_MODE,
        durationSeconds: sel.durationSeconds,
        distanceMeters: sel.distanceMeters,
      } satisfies ScheduleItemRouteResponse;
    }
    if (routePayloadOk(drivingRoute)) {
      const rc = canonicalScheduleTravelMode(
        typeof drivingRoute.travelMode === "string"
          ? drivingRoute.travelMode.trim()
          : "",
      );
      if (rc === FIXED_TRAVEL_MODE) return drivingRoute;
    }
    return undefined;
  }, [modeRouteSummaries, drivingRoute]);

  const dq0Pending = deferredRouteQueries[0]?.isPending ?? false;
  const dq0Fetching = deferredRouteQueries[0]?.isFetching ?? false;
  const dq1Pending = deferredRouteQueries[1]?.isPending ?? false;
  const dq1Fetching = deferredRouteQueries[1]?.isFetching ?? false;
  const dq2Pending = deferredRouteQueries[2]?.isPending ?? false;
  const dq2Fetching = deferredRouteQueries[2]?.isFetching ?? false;

  const modeRouteRowLoading = useMemo(() => {
    const out: Partial<Record<ScheduleTravelModeValue, boolean>> = {};
    const hasSummary = (m: ScheduleTravelModeValue) => {
      const s = modeRouteSummaries[m];
      return (
        s != null &&
        s.durationSeconds >= 0 &&
        s.distanceMeters >= 0
      );
    };
    if (routeQueryEnabled) {
      out[FIXED_TRAVEL_MODE] =
        !hasSummary(FIXED_TRAVEL_MODE) &&
        (drivingPending || drivingFetching);
      const pendFetch = [
        dq0Pending || dq0Fetching,
        dq1Pending || dq1Fetching,
        dq2Pending || dq2Fetching,
      ] as const;
      SCHEDULE_ROUTE_DEFERRED_FETCH_MODES.forEach((mode, i) => {
        out[mode] =
          deferredLazyEnabled &&
          !hasSummary(mode) &&
          pendFetch[i]!;
      });
    }
    return out;
  }, [
    modeRouteSummaries,
    routeQueryEnabled,
    deferredLazyEnabled,
    drivingPending,
    drivingFetching,
    dq0Pending,
    dq0Fetching,
    dq1Pending,
    dq1Fetching,
    dq2Pending,
    dq2Fetching,
  ]);

  const activeBackingQueryStatus = {
    isPending: drivingPending,
    isFetching: drivingFetching,
    isError: drivingError,
  } as const;

  const primarySettled =
    !activeBackingQueryStatus.isPending &&
    !activeBackingQueryStatus.isFetching;

  const summaryFetching =
    !displayRoute && activeBackingQueryStatus.isFetching;

  const summaryPending =
    !displayRoute &&
    !activeBackingQueryStatus.isFetching &&
    activeBackingQueryStatus.isPending;

  const summaryIsError =
    !displayRoute && primarySettled && activeBackingQueryStatus.isError;

  const summaryUnavailable =
    !displayRoute &&
    primarySettled &&
    !summaryIsError;

  if (directionsHidden) {
    return (
      <PlanTravelTimeCollapsed
        className={className}
        onShowDirections={() => setDirectionsHidden(false)}
      />
    );
  }

  return (
    <div
      className={cn("flex items-stretch gap-3 py-2 pl-1", className)}
      role="separator"
      aria-label="이동 시간 및 길찾기"
    >
      <TravelRouteRail arrowClassName="text-brand-green" />
      <div
        className="flex shrink-0 flex-col justify-center py-0.5"
        style={{ width: PLAN_ROUTE_CARD_WIDTH_PX }}
      >
        <TravelDirectionsCard
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((o) => !o)}
          summaryMode={FIXED_TRAVEL_MODE}
          route={displayRoute}
          routeQuery={{
            isPending: summaryPending,
            isError: summaryIsError,
            isFetching: summaryFetching,
          }}
          routeUnavailable={summaryUnavailable}
          modeRouteSummaries={modeRouteSummaries}
          modeRouteRowLoading={modeRouteRowLoading}
          effectiveMode={FIXED_TRAVEL_MODE}
          showUnknownOption={false}
          modeRaw=""
          readOnly
          onHideDirections={() => {
            setDirectionsHidden(true);
            setMenuOpen(false);
          }}
        />
      </div>
    </div>
  );
}
