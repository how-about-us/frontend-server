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
      className={cn("flex items-stretch gap-3 py-1 pl-1", className)}
      role="separator"
    >
      <TravelRouteRail arrowClassName="text-light-gray" />
      <div className="flex min-w-0 flex-1 items-center py-1">
        <button
          type="button"
          className="text-xs text-brand-green underline-offset-2 hover:underline"
          onClick={onShowDirections}
        >
          길찾기 표시
        </button>
      </div>
    </div>
  );
}
