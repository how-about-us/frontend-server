"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";

import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import {
  getScheduleItemRoutePersisted,
  readTravelModeFromLocalStorage,
  writeTravelModeToLocalStorage,
} from "@/lib/plan/planTravelLocalStorage";
import { useScheduleItemRoute } from "@/hooks/useRooms";
import {
  SCHEDULE_TRAVEL_MODES,
  canonicalScheduleTravelMode,
  type ScheduleTravelModeValue,
} from "@/lib/plan/scheduleTravelMode";
import { scheduleItemRouteQueryKey } from "@/lib/queryKeys/scheduleRoutes";
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
  /** 현재 일정의 `itemId` 순서 지문(localStorage·쿼리 키). 추가/삭제/리오더 시 바뀌면 캐시 무효. */
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
        ) ?? SCHEDULE_TRAVEL_MODES[0].value
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
      ) ?? SCHEDULE_TRAVEL_MODES[0].value,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `travelMode` 제외: 지문·구간이 같으면 LS·현재 선택을 유지
  }, [
    roomId,
    scheduleId,
    segmentSourceItemId,
    fpTrim,
  ]);

  const modeRaw = typeof travelMode === "string" ? travelMode.trim() : "";
  const canonFromPayload = canonicalScheduleTravelMode(
    modeRaw.length > 0 ? modeRaw : undefined,
  );

  const {
    data: route,
    isPending,
    isError,
    isFetching,
  } = useScheduleItemRoute(
    roomId,
    scheduleId,
    segmentSourceItemId,
    selectedMode,
    routeQueryEnabled,
    fpTrim,
  );

  const knownValues = new Set<string>(
    SCHEDULE_TRAVEL_MODES.map((m) => m.value),
  );
  const showUnknownOption =
    modeRaw.length > 0 &&
    canonFromPayload === null &&
    !knownValues.has(modeRaw.toUpperCase());

  const modeRouteQueries = useQueries({
    queries: SCHEDULE_TRAVEL_MODES.map(({ value }) => ({
      queryKey: scheduleItemRouteQueryKey(
        roomId,
        scheduleId,
        segmentSourceItemId,
        value,
        fpTrim.length > 0 ? fpTrim : null,
      ),
      queryFn: () =>
        getScheduleItemRoutePersisted(
          roomId,
          scheduleId,
          segmentSourceItemId,
          value,
          fpTrim,
        ),
      enabled:
        routeQueryEnabled &&
        !directionsHidden &&
        roomId.trim().length > 0 &&
        typeof scheduleId === "number" &&
        typeof segmentSourceItemId === "number",
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: false,
    })),
  });

  const handleTravelModeChange = useCallback(
    (next: ScheduleTravelModeValue) => {
      if (next === selectedMode) return;
      setSelectedMode(next);
      setMenuOpen(false);
      if (fpTrim.length > 0) {
        writeTravelModeToLocalStorage(
          roomId,
          scheduleId,
          segmentSourceItemId,
          fpTrim,
          next,
        );
      }
    },
    [
      selectedMode,
      roomId,
      scheduleId,
      segmentSourceItemId,
      fpTrim,
    ],
  );

  const displayRoute = useMemo(() => {
    if (routePayloadOk(route)) return route;

    const values = SCHEDULE_TRAVEL_MODES.map((m) => m.value);
    const pref = values.indexOf(selectedMode);
    const order =
      pref >= 0
        ? [pref, ...values.map((_, i) => i).filter((i) => i !== pref)]
        : values.map((_, i) => i);

    for (const i of order) {
      const d = modeRouteQueries[i]?.data;
      if (routePayloadOk(d)) return d;
    }
    return undefined;
  }, [
    route,
    selectedMode,
    modeRouteQueries[0]?.data,
    modeRouteQueries[1]?.data,
    modeRouteQueries[2]?.data,
    modeRouteQueries[3]?.data,
  ]);

  const primarySettled = !isPending && !isFetching;
  const modesSettled = modeRouteQueries.every(
    (q) => !q.isPending && !q.isFetching,
  );
  const allRouteQueriesSettled = primarySettled && modesSettled;

  const summaryFetching =
    !displayRoute &&
    (isFetching || modeRouteQueries.some((q) => q.isFetching));

  const summaryPending =
    !displayRoute &&
    !summaryFetching &&
    (isPending || modeRouteQueries.some((q) => q.isPending));

  const summaryIsError =
    !displayRoute &&
    allRouteQueriesSettled &&
    (isError || modeRouteQueries.some((q) => q.isError));

  const summaryUnavailable =
    !displayRoute &&
    allRouteQueriesSettled &&
    !summaryIsError;

  const summaryMode =
    displayRoute?.travelMode?.trim() ||
    route?.travelMode?.trim() ||
    selectedMode;

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
      <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
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
          modeRouteQueries={modeRouteQueries}
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
