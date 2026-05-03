import { Loader2 } from "lucide-react";

import type { ScheduleItemRouteResponse } from "@/lib/api/rooms";
import { formatRouteDistance, formatRouteDuration } from "@/lib/plan/routeFormat";

type TravelRouteSummaryLineProps = {
  route: ScheduleItemRouteResponse | null | undefined;
  isPending: boolean;
  isError: boolean;
  routeUnavailable: boolean;
};

export function TravelRouteSummaryLine({
  route,
  isPending,
  isError,
  routeUnavailable,
}: TravelRouteSummaryLineProps) {
  if (
    route &&
    route.durationSeconds >= 0 &&
    route.distanceMeters >= 0
  ) {
    return (
      <>
        {formatRouteDuration(route.durationSeconds)}
        <span className="mx-1 text-light-gray">·</span>
        {formatRouteDistance(route.distanceMeters)}
      </>
    );
  }
  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-green" />
        불러오는 중…
      </span>
    );
  }
  if (isError) return "이동 시간을 불러오지 못했어요";
  if (routeUnavailable) return "이 구간은 이동 안내를 제공하지 않아요";
  return "다음 장소로 이동";
}
