"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";

import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import { getScheduleItemRoute } from "@/lib/api/rooms";
import {
  useScheduleItemRoute,
  useUpdateScheduleItemTravelMode,
} from "@/hooks/useRooms";
import {
  SCHEDULE_TRAVEL_MODES,
  canonicalScheduleTravelMode,
  type ScheduleTravelModeValue,
} from "@/lib/plan/scheduleTravelMode";
import { scheduleItemRouteQueryKey } from "@/lib/queryKeys/scheduleRoutes";
import { cn } from "@/lib/utils";

import { PlanTravelTimeCollapsed } from "./plan-travel-time/PlanTravelTimeCollapsed";
import { TravelDirectionsCard } from "./plan-travel-time/TravelDirectionsCard";
import { TravelRouteRail } from "./plan-travel-time/TravelRouteRail";

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
  /** GET route 명세: 현재 일정 항목 → 다음 항목 구간 */
  segmentSourceItemId: number;
  /** PATCH `UpdateTravelModeRequest` — 명세상 `itemId`는 「다음 장소」일정 항목(toPlace) ID */
  destinationItemId: number;
  /** 장소 카드에 표시되는 구간 기본 이동 수단(일정 항목 travelMode) */
  travelMode: string;
  /** 일정 항목 목록이 준비·갱신 완료되고 종점 둘 다 목록에 있을 때만 route GET 허용 */
  routeQueryEnabled?: boolean;
  className?: string;
};

export function PlanTravelTime({
  roomId,
  scheduleId,
  segmentSourceItemId,
  destinationItemId,
  travelMode,
  routeQueryEnabled = true,
  className,
}: PlanTravelTimeProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [directionsHidden, setDirectionsHidden] = useState(false);

  const { mutateAsync: patchTravelMode, isPending: isPatchPending } =
    useUpdateScheduleItemTravelMode();

  const modeRaw = typeof travelMode === "string" ? travelMode.trim() : "";
  const canonFromPayload = canonicalScheduleTravelMode(
    modeRaw.length > 0 ? modeRaw : undefined,
  );
  const effectiveMode =
    canonFromPayload ?? SCHEDULE_TRAVEL_MODES[0].value;

  const {
    data: route,
    isPending,
    isError,
    isFetching,
  } = useScheduleItemRoute(
    roomId,
    scheduleId,
    segmentSourceItemId,
    effectiveMode,
    routeQueryEnabled,
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
      ),
      queryFn: () =>
        getScheduleItemRoute(roomId, scheduleId, segmentSourceItemId, value),
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
    async (next: ScheduleTravelModeValue) => {
      if (next === effectiveMode || isPatchPending) return;
      try {
        await patchTravelMode({
          roomId,
          scheduleId,
          itemId: destinationItemId,
          body: { travelMode: next },
        });
        setMenuOpen(false);
      } catch {
        toast.error("이동 수단을 바꾸지 못했어요.");
      }
    },
    [
      destinationItemId,
      effectiveMode,
      isPatchPending,
      patchTravelMode,
      roomId,
      scheduleId,
    ],
  );

  const displayRoute = useMemo(() => {
    if (routePayloadOk(route)) return route;

    const values = SCHEDULE_TRAVEL_MODES.map((m) => m.value);
    const pref = values.indexOf(effectiveMode);
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
    effectiveMode,
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
    effectiveMode;

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
          effectiveMode={effectiveMode}
          isPatchPending={isPatchPending}
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
