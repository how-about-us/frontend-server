"use client";

import { ChevronDown, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import {
  formatRouteDistance,
  formatRouteDuration,
} from "@/lib/plan/routeFormat";
import type { ScheduleItemRouteSummary } from "@/lib/plan/scheduleItemRouteModes";
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
  /** 헤더 글리프·요약 줄에 쓰이는 수단 — 플랜에서는 항상 자동차 고정 */
  summaryMode: string;
  route: ScheduleItemRouteResponse | null | undefined;
  routeQuery: {
    isPending: boolean;
    isError: boolean;
    isFetching: boolean;
  };
  routeUnavailable: boolean;
  /** 수단별 `GET …/route` 결과 합본(DRIVING=초기·나머지=메뉴 오픈 시 패치·캐시 재사용) */
  modeRouteSummaries?: Partial<
    Record<ScheduleTravelModeValue, ScheduleItemRouteSummary>
  >;
  modeRouteRowLoading?: Partial<Record<ScheduleTravelModeValue, boolean>>;
  effectiveMode: ScheduleTravelModeValue;
  showUnknownOption: boolean;
  modeRaw: string;
  /** true면 목록은 참고용(클릭 선택 불가), `onSelectTravelMode` 미사용 */
  readOnly?: boolean;
  onSelectTravelMode?: (next: ScheduleTravelModeValue) => void;
  onHideDirections: () => void;
};

export function TravelDirectionsCard({
  menuOpen,
  onToggleMenu,
  summaryMode,
  route,
  routeQuery,
  routeUnavailable,
  modeRouteSummaries = {},
  modeRouteRowLoading = {},
  effectiveMode,
  showUnknownOption,
  modeRaw,
  readOnly = false,
  onSelectTravelMode,
  onHideDirections,
}: TravelDirectionsCardProps) {
  /** 부모 기준 현재 헤더·요약 줄에 해당하는 표준 코드(처음에는 서버, 선택 후 사용자) */
  const headerTravelMode =
    canonicalScheduleTravelMode(summaryMode) ?? summaryMode;

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
          aria-hidden
        />
      </button>

      {menuOpen ? (
        <div className="w-fit max-w-full border-t border-gray-border px-2.5 py-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-dark-gray">
            {readOnly ? "다른 수단 참고(자동차 고정)" : "이동 수단"}
          </p>
          <ul
            className="flex flex-col gap-1"
            role={readOnly ? undefined : "listbox"}
          >
            {SCHEDULE_TRAVEL_MODES.map(({ value }) => {
              const rowSummary = modeRouteSummaries[value];
              const row =
                rowSummary &&
                rowSummary.durationSeconds >= 0 &&
                rowSummary.distanceMeters >= 0 ? (
                  <>
                    {formatRouteDuration(rowSummary.durationSeconds)}
                    <span className="mx-1 text-light-gray">·</span>
                    {formatRouteDistance(rowSummary.distanceMeters)}
                  </>
                ) : modeRouteRowLoading[value] ? (
                  <span className="inline-flex items-center gap-1 text-dark-gray">
                    <Loader2 className="h-3 w-3 animate-spin" />
                  </span>
                ) : (
                  <span className="text-dark-gray">—</span>
                );
              const selected = value === effectiveMode;
              const rowClass = cn(
                "flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-xs",
                !readOnly && "hover:bg-gray-border/30",
                selected &&
                  (readOnly ?
                    "bg-gray-50 ring-1 ring-gray-border/40"
                  : "bg-brand-green/10 ring-1 ring-brand-green/25"),
              );

              if (readOnly) {
                return (
                  <li key={value}>
                    <div className={rowClass}>
                      <TravelModeGlyph mode={value} />
                      <span className="font-medium text-gray-900">
                        {scheduleTravelModeLabel(value)}
                      </span>
                      {selected ?
                        <span className="ml-auto shrink-0 text-[10px] font-semibold text-dark-gray">
                          적용 중
                        </span>
                      : <span className="ml-auto text-dark-gray">{row}</span>}
                    </div>
                  </li>
                );
              }

              return (
                <li key={value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      rowClass,
                      "disabled:opacity-50",
                    )}
                    onClick={() => {
                      void onSelectTravelMode?.(value);
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
            {showUnknownOption && !readOnly ? (
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
                    void onSelectTravelMode?.(c);
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
            숨기기
          </button>
        </div>
      ) : null}
    </div>
  );
}
