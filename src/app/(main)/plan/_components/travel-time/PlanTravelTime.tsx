"use client";

import { useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import { useScheduleItemRoute } from "@/hooks/useRooms";
import { persistedScheduleItemRouteQueryOptions } from "@/lib/plan/scheduleItemRoutePersistedQuery";
import {
  readTravelModeFromLocalStorage,
  writeTravelModeToLocalStorage,
} from "@/lib/plan/planTravelLocalStorage";
import { buildScheduleItemRouteSummariesByMode } from "@/lib/plan/scheduleItemRouteModes";
import {
  SCHEDULE_ROUTE_DEFERRED_FETCH_MODES,
  SCHEDULE_ROUTE_PRIMARY_FETCH_MODE,
  SCHEDULE_TRAVEL_MODES,
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

export type PlanTravelTimeProps = {
  roomId: string;
  scheduleId: number;
  /** 현재 항목 → 다음 항목 구간의 시작 일정 항목 ID (`GET …/route` 에 사용) */
  segmentSourceItemId: number;
  /** 일정 `itemId` 순서 지문 — 로컬 이동 수단 선택(LS) 일치용. 경로 API 쿼리 키에는 사용하지 않음 */
  scheduleFingerprint: string;
  /** 일정 항목에 붙어 있으면 초기 이동 수단 추정값(표시용). 선택은 서버 저장 없음, LS에만 저장 */
  travelMode?: string;
  /** 일정 항목 목록이 준비·갱신 완료되고 종점 둘 다 목록에 있을 때만 route GET 허용 */
  routeQueryEnabled?: boolean;
  className?: string;
};

export function PlanTravelTime({
  roomId,
  scheduleId,
  segmentSourceItemId,
  scheduleFingerprint,
  travelMode,
  routeQueryEnabled = true,
  className,
}: PlanTravelTimeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [directionsHidden, setDirectionsHidden] = useState(false);
  /** false: 헤더·요약 줄은 서버 응답 `travelMode` 기준 → true 드롭다운 선택에 맞춤 */
  const [commitSummaryToUserChoice, setCommitSummaryToUserChoice] =
    useState(false);

  const fpTrim = scheduleFingerprint.trim();

  const [selectedMode, setSelectedMode] =
    useState<ScheduleTravelModeValue>(() => {
      if (fpTrim.length > 0) {
        const fromLs = readTravelModeFromLocalStorage(
          roomId,
          scheduleId,
          segmentSourceItemId,
          fpTrim,
        );
        if (fromLs) return fromLs;
      }
      return (
        canonicalScheduleTravelMode(
          typeof travelMode === "string" && travelMode.trim()
            ? travelMode.trim()
            : undefined,
        ) ?? SCHEDULE_ROUTE_PRIMARY_FETCH_MODE
      );
    });

  useEffect(() => {
    if (fpTrim.length > 0) {
      const fromLs = readTravelModeFromLocalStorage(
        roomId,
        scheduleId,
        segmentSourceItemId,
        fpTrim,
      );
      if (fromLs != null) {
        setSelectedMode(fromLs);
        return;
      }
    }
    setSelectedMode(
      canonicalScheduleTravelMode(
        typeof travelMode === "string" && travelMode.trim()
          ? travelMode.trim()
          : undefined,
      ) ?? SCHEDULE_ROUTE_PRIMARY_FETCH_MODE,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `travelMode` 제외: 지문·구간이 같으면 LS·현재 선택을 유지
  }, [
    roomId,
    scheduleId,
    segmentSourceItemId,
    fpTrim,
  ]);

  useEffect(() => {
    setCommitSummaryToUserChoice(false);
  }, [roomId, scheduleId, segmentSourceItemId, fpTrim]);

  const rid = roomId.trim();

  const modeRaw = typeof travelMode === "string" ? travelMode.trim() : "";
  const canonFromPayload = canonicalScheduleTravelMode(
    modeRaw.length > 0 ? modeRaw : undefined,
  );

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

  const knownValues = new Set<string>(
    SCHEDULE_TRAVEL_MODES.map((m) => m.value),
  );
  const showUnknownOption =
    modeRaw.length > 0 &&
    canonFromPayload === null &&
    !knownValues.has(modeRaw.toUpperCase());

  const handleTravelModeChange = useCallback(
    (next: ScheduleTravelModeValue) => {
      setCommitSummaryToUserChoice(true);
      if (next !== selectedMode) {
        setSelectedMode(next);
        if (fpTrim.length > 0) {
          writeTravelModeToLocalStorage(
            roomId,
            scheduleId,
            segmentSourceItemId,
            fpTrim,
            next,
          );
        }
      }
      setMenuOpen(false);
    },
    [
      selectedMode,
      roomId,
      scheduleId,
      segmentSourceItemId,
      fpTrim,
    ],
  );

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
    const mode = selectedMode;
    const sel = modeRouteSummaries[mode];
    if (
      sel != null &&
      sel.durationSeconds >= 0 &&
      sel.distanceMeters >= 0
    ) {
      return {
        travelMode: mode,
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
      if (rc === mode) return drivingRoute;
    }
    return undefined;
  }, [modeRouteSummaries, drivingRoute, selectedMode]);

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
      out[SCHEDULE_ROUTE_PRIMARY_FETCH_MODE] =
        !hasSummary(SCHEDULE_ROUTE_PRIMARY_FETCH_MODE) &&
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

  const dq0Error = deferredRouteQueries[0]?.isError ?? false;
  const dq1Error = deferredRouteQueries[1]?.isError ?? false;
  const dq2Error = deferredRouteQueries[2]?.isError ?? false;

  const activeBackingQueryStatus = useMemo(() => {
    /**
     * 마운트~첫 선택 전까지 네트워크는 DRIVING 한 번만 보냄.
     * `enabled: false` 인 지연 쿼리는 `isPending` 이 true로 남는 경우가 있어
     * 요약 줄 로딩에 끌어다 쓰면 스피너가 무한히 도는 버그가 난다.
     */
    if (!commitSummaryToUserChoice) {
      return {
        isPending: drivingPending,
        isFetching: drivingFetching,
        isError: drivingError,
      } as const;
    }

    if (selectedMode === SCHEDULE_ROUTE_PRIMARY_FETCH_MODE) {
      return {
        isPending: drivingPending,
        isFetching: drivingFetching,
        isError: drivingError,
      } as const;
    }
    const deferredList =
      SCHEDULE_ROUTE_DEFERRED_FETCH_MODES as readonly ScheduleTravelModeValue[];
    const idx = deferredList.indexOf(selectedMode);
    if (idx === 0) {
      return {
        isPending: deferredLazyEnabled && dq0Pending,
        isFetching: deferredLazyEnabled && dq0Fetching,
        isError: dq0Error,
      } as const;
    }
    if (idx === 1) {
      return {
        isPending: deferredLazyEnabled && dq1Pending,
        isFetching: deferredLazyEnabled && dq1Fetching,
        isError: dq1Error,
      } as const;
    }
    if (idx === 2) {
      return {
        isPending: deferredLazyEnabled && dq2Pending,
        isFetching: deferredLazyEnabled && dq2Fetching,
        isError: dq2Error,
      } as const;
    }
    return {
      isPending: drivingPending,
      isFetching: drivingFetching,
      isError: drivingError,
    } as const;
  }, [
    commitSummaryToUserChoice,
    selectedMode,
    deferredLazyEnabled,
    drivingPending,
    drivingFetching,
    drivingError,
    dq0Pending,
    dq0Fetching,
    dq0Error,
    dq1Pending,
    dq1Fetching,
    dq1Error,
    dq2Pending,
    dq2Fetching,
    dq2Error,
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

  const summaryMode = selectedMode;

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
          setMenuOpen={setMenuOpen}
          summaryMode={summaryMode}
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
          showUnknownOption={showUnknownOption}
          modeRaw={modeRaw}
          onSelectTravelMode={handleTravelModeChange}
          onHideDirections={() => {
            setDirectionsHidden(true);
            setMenuOpen(false);
          }}
        />
      </div>
    </div>
  );
}
