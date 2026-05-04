"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import { useScheduleItemRoute } from "@/hooks/useRooms";
import {
  readTravelModeFromLocalStorage,
  writeTravelModeToLocalStorage,
} from "@/lib/plan/planTravelLocalStorage";
import {
  SCHEDULE_TRAVEL_MODES,
  canonicalScheduleTravelMode,
  type ScheduleTravelModeValue,
} from "@/lib/plan/scheduleTravelMode";
import { buildScheduleItemRouteSummariesByMode } from "@/lib/plan/scheduleItemRouteModes";
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

  useEffect(() => {
    setCommitSummaryToUserChoice(false);
  }, [roomId, scheduleId, segmentSourceItemId, fpTrim]);

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
    routeQueryEnabled,
  );

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

  const activeSummaryTravelMode = useMemo((): ScheduleTravelModeValue => {
    if (!commitSummaryToUserChoice && routePayloadOk(route)) {
      const tm =
        typeof route.travelMode === "string" ? route.travelMode.trim() : "";
      return (
        (tm.length > 0 ? canonicalScheduleTravelMode(tm) : null) ?? selectedMode
      );
    }
    return selectedMode;
  }, [
    commitSummaryToUserChoice,
    route,
    selectedMode,
  ]);

  const modeRouteSummaries = useMemo(
    () => buildScheduleItemRouteSummariesByMode(route ?? undefined),
    [route],
  );

  const displayRoute = useMemo(() => {
    const mode = activeSummaryTravelMode;
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
    if (routePayloadOk(route)) {
      const rc = canonicalScheduleTravelMode(
        typeof route.travelMode === "string" ? route.travelMode.trim() : "",
      );
      if (rc === mode) return route;
    }
    return undefined;
  }, [modeRouteSummaries, route, activeSummaryTravelMode]);

  const primarySettled = !isPending && !isFetching;

  const summaryFetching = !displayRoute && isFetching;

  const summaryPending =
    !displayRoute && !summaryFetching && isPending;

  const summaryIsError =
    !displayRoute && primarySettled && isError;

  const summaryUnavailable =
    !displayRoute &&
    primarySettled &&
    !summaryIsError;

  const summaryMode = activeSummaryTravelMode;

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
          modeRouteSummaries={modeRouteSummaries}
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
