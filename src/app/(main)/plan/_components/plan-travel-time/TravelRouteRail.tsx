import { ArrowDown } from "lucide-react";

import { cn } from "@/lib/utils";

type TravelRouteRailProps = {
  /** 화살표 색 — 구간 활성·숨김 상태에 따라 `text-brand-green` / `text-light-gray` 등 */
  arrowClassName: string;
};

export function TravelRouteRail({ arrowClassName }: TravelRouteRailProps) {
  return (
    <div className="flex w-8 shrink-0 flex-col items-center">
      <div className="min-h-3 flex-1 w-px bg-gradient-to-b from-gray-border to-light-gray" />
      <ArrowDown
        className={cn("my-1 h-4 w-4 shrink-0", arrowClassName)}
        aria-hidden
      />
      <div className="min-h-3 flex-1 w-px bg-gradient-to-b from-light-gray to-gray-border" />
    </div>
  );
}
