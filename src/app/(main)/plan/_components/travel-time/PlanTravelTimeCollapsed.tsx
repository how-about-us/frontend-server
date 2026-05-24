import { PLAN_ROUTE_CARD_WIDTH_PX } from "@/lib/layout-tokens";
import { cn } from "@/lib/utils";

import { TravelRouteRail } from "./TravelRouteRail";

type PlanTravelTimeCollapsedProps = {
  className?: string;
  onShowDirections: () => void;
};

export function PlanTravelTimeCollapsed({
  className,
  onShowDirections,
}: PlanTravelTimeCollapsedProps) {
  return (
    <div
      className={cn("flex items-stretch gap-3 py-0.5 pl-1", className)}
      role="separator"
    >
      <TravelRouteRail arrowClassName="text-light-gray" />
      <div
        className="flex shrink-0 items-center py-1"
        style={{ width: PLAN_ROUTE_CARD_WIDTH_PX }}
      >
        <button
          type="button"
          className="cursor-pointer text-xs text-brand-green underline-offset-2 hover:underline"
          onClick={onShowDirections}
        >
          길찾기 표시
        </button>
      </div>
    </div>
  );
}
