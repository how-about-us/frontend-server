"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { ChevronDown, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import {
  formatRouteDistance,
  formatRouteDuration,
} from "@/lib/plan/routeFormat";
import {
  SCHEDULE_TRAVEL_MODES,
  canonicalScheduleTravelMode,
  scheduleTravelModeLabel,
  type ScheduleTravelModeValue,
} from "@/lib/plan/scheduleTravelMode";
import { cn } from "@/lib/utils";

import { TravelModeGlyph } from "./TravelModeGlyph";
import { TravelRouteSummaryLine } from "./TravelRouteSummaryLine";

export type TravelDirectionsCardProps = {
  menuOpen: boolean;
  onToggleMenu: () => void;
  setMenuOpen: (open: boolean) => void;
  summaryMode: string;
  route: ScheduleItemRouteResponse | null | undefined;
  routeQuery: Pick<
    UseQueryResult<ScheduleItemRouteResponse | null, Error>,
    "isPending" | "isError" | "isFetching"
  >;
  routeUnavailable: boolean;
  /** 이전에는 수단별 조회 결과를 넘겼음. 경로 GET은 브로드캐스트·초기 조회만 하므로 비워 둠 */
  modeRouteQueries?: Array<
    UseQueryResult<ScheduleItemRouteResponse | null, Error>
  >;
  effectiveMode: ScheduleTravelModeValue;
  showUnknownOption: boolean;
  modeRaw: string;
  onSelectTravelMode: (next: ScheduleTravelModeValue) => void;
  onHideDirections: () => void;
};

export function TravelDirectionsCard({
  menuOpen,
  onToggleMenu,
  setMenuOpen,
  summaryMode,
  route,
  routeQuery,
  routeUnavailable,
  modeRouteQueries = [],
  effectiveMode,
  showUnknownOption,
  modeRaw,
  onSelectTravelMode,
  onHideDirections,
}: TravelDirectionsCardProps) {
  const routeTravelRaw =
    route != null &&
    typeof route.travelMode === "string" &&
    route.travelMode.trim().length > 0
      ? route.travelMode.trim()
      : null;

  /** /route 200 본문이 있으면 요약·글리프 모두 응답 `travelMode` 기준 */
  const headerTravelMode =
    routeTravelRaw != null
      ? canonicalScheduleTravelMode(routeTravelRaw) ?? routeTravelRaw
      : summaryMode;

  const summaryLine = (
    <TravelRouteSummaryLine
      route={route}
      isPending={routeQuery.isPending}
      isFetching={routeQuery.isFetching}
      isError={routeQuery.isError}
      routeUnavailable={routeUnavailable}
    />
  );

  return (
    <div className="relative">
      <button
        type="button"
        className="flex w-[40%] items-center gap-2 px-2.5 py-2 text-left"
        aria-expanded={menuOpen}
        onClick={onToggleMenu}
      >
        <TravelModeGlyph mode={headerTravelMode} />
        <span className="min-w-0 flex-1 text-xs font-medium text-gray-900">
          {summaryLine}
        </span>

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
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs hover:bg-gray-border/30 disabled:opacity-50",
                      selected &&
                        "bg-brand-green/10 ring-1 ring-brand-green/25",
                    )}
                    onClick={() => {
                      if (selected) {
                        setMenuOpen(false);
                        return;
                      }
                      void onSelectTravelMode(value);
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
                  className="flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs hover:bg-gray-border/30 disabled:opacity-50"
                  onClick={() => {
                    const c = canonicalScheduleTravelMode(modeRaw);
                    if (!c) {
                      toast.error(
                        "표준 이동 수단으로 바꿀 수 없어요. 목록에서 선택해 주세요.",
                      );
                      return;
                    }
                    void onSelectTravelMode(c);
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
            onClick={onHideDirections}
          >
            <EyeOff className="h-4 w-4 shrink-0" aria-hidden />
            길찾기 숨기기
          </button>
        </div>
      ) : null}
    </div>
  );
}
