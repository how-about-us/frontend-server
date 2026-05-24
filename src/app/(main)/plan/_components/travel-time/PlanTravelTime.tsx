"use client";

import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import { useScheduleItemRoute } from "@/hooks/useRooms";
import { persistedScheduleItemRouteQueryOptions } from "@/lib/plan/scheduleItemRoutePersistedQuery";
import { buildScheduleItemRouteSummariesByMode } from "@/lib/plan/scheduleItemRouteModes";
import {
  readTravelModeFromSessionStorage,
  writeTravelModeToSessionStorage,
} from "@/lib/plan/planTravelLocalStorage";
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

function readStoredSegmentMode(
  roomId: string,
  scheduleId: number,
  segmentSourceItemId: number,
  fingerprint: string,
): ScheduleTravelModeValue {
  if (!fingerprint.length) return SCHEDULE_ROUTE_PRIMARY_FETCH_MODE;
  return (
    readTravelModeFromSessionStorage(
      roomId,
      scheduleId,
      segmentSourceItemId,
      fingerprint,
    ) ?? SCHEDULE_ROUTE_PRIMARY_FETCH_MODE
  );
}

export type PlanTravelTimeProps = {
  roomId: string;
  scheduleId: number;
  segmentSourceItemId: number;
  scheduleFingerprint: string;
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

  const [selectedMode, setSelectedMode] = useState<ScheduleTravelModeValue>(
    () =>
      readStoredSegmentMode(rid, scheduleId, segmentSourceItemId, fpTrim),
  );

  useEffect(() => {
    setSelectedMode(
      readStoredSegmentMode(rid, scheduleId, segmentSourceItemId, fpTrim),
    );
  }, [rid, scheduleId, segmentSourceItemId, fpTrim]);

  const {
    data: drivingRoute,
    isPending: drivingPending,
    isError: drivingError,
    isFetching: drivingFetching,
  } = useScheduleItemRoute(
    roomId,
    scheduleId,
    segmentSourceItemId,
    SCHEDULE_ROUTE_PRIMARY_FETCH_MODE,
    routeQueryEnabled,
    fpTrim,
  );

  const selectedNonDrivingEnabled =
    routeQueryEnabled &&
    selectedMode !== SCHEDULE_ROUTE_PRIMARY_FETCH_MODE;

  const {
    data: selectedRoute,
    isPending: selectedPending,
    isError: selectedError,
    isFetching: selectedFetching,
  } = useScheduleItemRoute(
    roomId,
    scheduleId,
    segmentSourceItemId,
    selectedMode,
    selectedNonDrivingEnabled,
    fpTrim,
  );

  const deferredLazyEnabled =
    routeQueryEnabled &&
    menuOpen &&
    rid.length > 0 &&
    Number.isFinite(scheduleId) &&
    Number.isFinite(segmentSourceItemId);

  const menuDeferredModes = useMemo(
    () =>
      SCHEDULE_ROUTE_DEFERRED_FETCH_MODES.filter((m) => m !== selectedMode),
    [selectedMode],
  );

  const deferredRouteQueries = useQueries({
    queries: menuDeferredModes.map((mode) =>
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
    if (selectedMode !== SCHEDULE_ROUTE_PRIMARY_FETCH_MODE) {
      apply(selectedRoute);
    }
    menuDeferredModes.forEach((_mode, i) => {
      apply(deferredRouteQueries[i]?.data);
    });

    return merged;
  }, [
    drivingRoute,
    selectedMode,
    selectedRoute,
    menuDeferredModes,
    deferredRouteQueries,
  ]);

  const displayRoute = useMemo(() => {
    const sel = modeRouteSummaries[selectedMode];
    if (
      sel != null &&
      sel.durationSeconds >= 0 &&
      sel.distanceMeters >= 0
    ) {
      return {
        travelMode: selectedMode,
        durationSeconds: sel.durationSeconds,
        distanceMeters: sel.distanceMeters,
      } satisfies ScheduleItemRouteResponse;
    }
    if (selectedMode === SCHEDULE_ROUTE_PRIMARY_FETCH_MODE) {
      if (routePayloadOk(drivingRoute)) {
        const rc = canonicalScheduleTravelMode(
          typeof drivingRoute.travelMode === "string"
            ? drivingRoute.travelMode.trim()
            : "",
        );
        if (rc === SCHEDULE_ROUTE_PRIMARY_FETCH_MODE) return drivingRoute;
      }
    } else if (routePayloadOk(selectedRoute)) {
      const rc = canonicalScheduleTravelMode(
        typeof selectedRoute.travelMode === "string"
          ? selectedRoute.travelMode.trim()
          : "",
      );
      if (rc === selectedMode) return selectedRoute;
    }
    return undefined;
  }, [modeRouteSummaries, selectedMode, drivingRoute, selectedRoute]);

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
      out[SCHEDULE_ROUTE_PRIMARY_FETCH_MODE] =
        !hasSummary(SCHEDULE_ROUTE_PRIMARY_FETCH_MODE) &&
        (drivingPending || drivingFetching);
      if (selectedMode !== SCHEDULE_ROUTE_PRIMARY_FETCH_MODE) {
        out[selectedMode] =
          !hasSummary(selectedMode) &&
          (selectedPending || selectedFetching);
      }
      menuDeferredModes.forEach((mode, i) => {
        const q = deferredRouteQueries[i];
        out[mode] =
          deferredLazyEnabled &&
          !hasSummary(mode) &&
          Boolean(q?.isPending || q?.isFetching);
      });
    }
    return out;
  }, [
    modeRouteSummaries,
    routeQueryEnabled,
    selectedMode,
    deferredLazyEnabled,
    drivingPending,
    drivingFetching,
    selectedPending,
    selectedFetching,
    menuDeferredModes,
    deferredRouteQueries,
  ]);

  const activeBackingQueryStatus = useMemo(() => {
    if (selectedMode === SCHEDULE_ROUTE_PRIMARY_FETCH_MODE) {
      return {
        isPending: drivingPending,
        isFetching: drivingFetching,
        isError: drivingError,
      } as const;
    }
    return {
      isPending: selectedPending,
      isFetching: selectedFetching,
      isError: selectedError,
    } as const;
  }, [
    selectedMode,
    drivingPending,
    drivingFetching,
    drivingError,
    selectedPending,
    selectedFetching,
    selectedError,
  ]);

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

  const handleSelectTravelMode = useCallback(
    (mode: ScheduleTravelModeValue) => {
      if (fpTrim.length) {
        writeTravelModeToSessionStorage(
          rid,
          scheduleId,
          segmentSourceItemId,
          fpTrim,
          mode,
        );
      }
      setSelectedMode(mode);
      setMenuOpen(false);
    },
    [rid, scheduleId, segmentSourceItemId, fpTrim],
  );

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
      className={cn("flex items-stretch gap-3 py-1 pl-1", className)}
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
          summaryMode={selectedMode}
          route={displayRoute}
          routeQuery={{
            isPending: summaryPending,
            isError: summaryIsError,
            isFetching: summaryFetching,
          }}
          routeUnavailable={summaryUnavailable}
          modeRouteSummaries={modeRouteSummaries}
          modeRouteRowLoading={modeRouteRowLoading}
          effectiveMode={selectedMode}
          showUnknownOption={false}
          modeRaw=""
          onSelectTravelMode={handleSelectTravelMode}
          onHideDirections={() => {
            setDirectionsHidden(true);
            setMenuOpen(false);
          }}
        />
      </div>
    </div>
  );
}
