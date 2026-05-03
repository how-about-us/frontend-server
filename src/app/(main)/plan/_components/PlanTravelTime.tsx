"use client";

import { useCallback, useState } from "react";
import {
  ArrowDown,
  Bike,
  Bus,
  Car,
  ChevronDown,
  EyeOff,
  Footprints,
  Loader2,
} from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { toast } from "sonner";

import { getScheduleItemRoute } from "@/lib/api/rooms";
import {
  useScheduleItemRoute,
  useUpdateScheduleItemTravelMode,
} from "@/hooks/useRooms";
import type { PlanPlace } from "@/lib/plan/types";
import { formatRouteDistance, formatRouteDuration } from "@/lib/plan/routeFormat";
import {
  SCHEDULE_TRAVEL_MODES,
  canonicalScheduleTravelMode,
  scheduleTravelModeLabel,
  type ScheduleTravelModeValue,
} from "@/lib/plan/scheduleTravelMode";
import { scheduleItemRouteQueryKey } from "@/lib/queryKeys/scheduleRoutes";
import { cn } from "@/lib/utils";

export type PlanTravelTimeProps = {
  roomId: string;
  scheduleId: number;
  /** GET route 명세: 현재 일정 항목 → 다음 항목 구간 */
  segmentSourceItemId: number;
  /** PATCH `UpdateTravelModeRequest` — 명세상 `itemId`는 「다음 장소」일정 항목(toPlace) ID */
  destinationItemId: number;
  /** 장소 카드에 표시되는 구간 기본 이동 수단(일정 항목 travelMode) */
  travelMode: string;
  fromPlace: PlanPlace;
  toPlace: PlanPlace;
  /** 일정 항목 목록이 준비·갱신 완료되고 종점 둘 다 목록에 있을 때만 route GET 허용 */
  routeQueryEnabled?: boolean;
  className?: string;
};

function TravelModeGlyph({ mode }: { mode: string }) {
  const key = mode.trim().toUpperCase();
  if (key.includes("WALK") || key === "WALKING")
    return <Footprints className="h-4 w-4 shrink-0 text-brand-green" />;
  if (
    key.includes("DRIVE") ||
    key.includes("CAR") ||
    key === "DRIVING"
  )
    return <Car className="h-4 w-4 shrink-0 text-brand-green" />;
  if (key.includes("TRANSIT") || key.includes("BUS") || key.includes("SUBWAY"))
    return <Bus className="h-4 w-4 shrink-0 text-brand-green" />;
  if (key.includes("CYCL") || key === "CYCLING" || key.includes("BICY"))
    return <Bike className="h-4 w-4 shrink-0 text-brand-green" />;
  return <Footprints className="h-4 w-4 shrink-0 text-brand-green" />;
}

export function PlanTravelTime({
  roomId,
  scheduleId,
  segmentSourceItemId,
  destinationItemId,
  travelMode,
  fromPlace,
  toPlace,
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

  const { data: route, isPending, isError } = useScheduleItemRoute(
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
        menuOpen &&
        !directionsHidden &&
        roomId.trim().length > 0 &&
        typeof scheduleId === "number" &&
        typeof segmentSourceItemId === "number",
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
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

  const summaryMode = route?.travelMode?.trim() || effectiveMode;

  const summaryLine =
    route && route.durationSeconds >= 0 && route.distanceMeters >= 0 ? (
      <>
        {formatRouteDuration(route.durationSeconds)}
        <span className="mx-1 text-light-gray">·</span>
        {formatRouteDistance(route.distanceMeters)}
      </>
    ) : isPending ? (
      <span className="inline-flex items-center gap-1.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-green" />
        불러오는 중…
      </span>
    ) : isError ? (
      "이동 시간을 불러오지 못했어요"
    ) : (
      "다음 장소로 이동"
    );

  const label =
    route && route.durationSeconds != null
      ? `${fromPlace.title}에서 ${toPlace.title}까지 약 ${formatRouteDuration(route.durationSeconds)}`
      : `${fromPlace.title}에서 ${toPlace.title}까지 이동`;

  if (directionsHidden) {
    return (
      <div
        className={cn("flex items-stretch gap-3 py-1 pl-1", className)}
        role="separator"
      >
        <div className="flex w-8 shrink-0 flex-col items-center">
          <div className="min-h-3 flex-1 w-px bg-gradient-to-b from-gray-border to-light-gray" />
          <ArrowDown
            className="my-1 h-4 w-4 shrink-0 text-light-gray"
            aria-hidden
          />
          <div className="min-h-3 flex-1 w-px bg-gradient-to-b from-light-gray to-gray-border" />
        </div>
        <div className="flex min-w-0 flex-1 items-center py-1">
          <button
            type="button"
            className="text-xs text-brand-green underline-offset-2 hover:underline"
            onClick={() => setDirectionsHidden(false)}
          >
            길찾기 표시
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex items-stretch gap-3 py-2 pl-1", className)}
      role="separator"
      aria-label={label}
    >
      <div className="flex w-8 shrink-0 flex-col items-center">
        <div className="min-h-3 flex-1 w-px bg-gradient-to-b from-gray-border to-light-gray" />
        <ArrowDown
          className="my-1 h-4 w-4 shrink-0 text-brand-green"
          aria-hidden
        />
        <div className="min-h-3 flex-1 w-px bg-gradient-to-b from-light-gray to-gray-border" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
        <p className="text-xs leading-snug text-dark-gray">
          <span className="font-medium text-gray-900">{fromPlace.title}</span>
          <span className="mx-1 text-light-gray">→</span>
          <span className="font-medium text-gray-900">{toPlace.title}</span>
        </p>

        <div className="relative rounded-lg border border-gray-border bg-white shadow-sm">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-2.5 py-2 text-left"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <TravelModeGlyph mode={summaryMode} />
            <span className="min-w-0 flex-1 text-xs font-medium text-gray-900">
              {summaryLine}
            </span>
            <span className="shrink-0 text-[11px] text-dark-gray">길찾기</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-dark-gray transition-transform",
                menuOpen && "rotate-180",
              )}
            />
          </button>

          {menuOpen ? (
            <div className="border-t border-gray-border px-2.5 py-2">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-dark-gray">
                이동 수단
              </p>
              <ul className="flex flex-col gap-1" role="listbox">
                {SCHEDULE_TRAVEL_MODES.map(({ value }, i) => {
                  const q = modeRouteQueries[i];
                  const row =
                    q?.data &&
                    q.data.durationSeconds >= 0 &&
                    q.data.distanceMeters >= 0 ? (
                      <>
                        {formatRouteDuration(q.data.durationSeconds)}
                        <span className="mx-1 text-light-gray">·</span>
                        {formatRouteDistance(q.data.distanceMeters)}
                      </>
                    ) : q?.isPending ? (
                      <span className="inline-flex items-center gap-1 text-dark-gray">
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </span>
                    ) : (
                      <span className="text-dark-gray">—</span>
                    );
                  const selected = value === effectiveMode;
                  return (
                    <li key={value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        disabled={isPatchPending && !selected}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs hover:bg-gray-border/30 disabled:opacity-50",
                          selected && "bg-brand-green/10 ring-1 ring-brand-green/25",
                        )}
                        onClick={() => {
                          if (selected) {
                            setMenuOpen(false);
                            return;
                          }
                          void handleTravelModeChange(value);
                        }}
                      >
                        <TravelModeGlyph mode={value} />
                        <span className="font-medium text-gray-900">
                          {scheduleTravelModeLabel(value)}
                        </span>
                        {selected ? (
                          <span className="ml-auto shrink-0 text-[10px] font-semibold uppercase text-brand-green">
                            선택됨
                          </span>
                        ) : (
                          <span className="ml-auto text-dark-gray">{row}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
                {showUnknownOption ? (
                  <li>
                    <button
                      type="button"
                      disabled={isPatchPending}
                      className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs hover:bg-gray-border/30 disabled:opacity-50"
                      onClick={() => {
                        const c = canonicalScheduleTravelMode(modeRaw);
                        if (!c) {
                          toast.error(
                            "표준 이동 수단으로 바꿀 수 없어요. 목록에서 선택해 주세요.",
                          );
                          return;
                        }
                        void handleTravelModeChange(c);
                      }}
                    >
                      <TravelModeGlyph mode={modeRaw} />
                      <span className="font-medium text-gray-900">
                        {scheduleTravelModeLabel(modeRaw)}
                      </span>
                      <span className="ml-auto text-[10px] text-dark-gray">
                        표준 값으로 변경
                      </span>
                    </button>
                  </li>
                ) : null}
              </ul>

              <div className="my-2 border-t border-gray-border" />

              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs text-dark-gray hover:bg-gray-border/30"
                onClick={() => {
                  setDirectionsHidden(true);
                  setMenuOpen(false);
                }}
              >
                <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
                길찾기 숨기기
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
