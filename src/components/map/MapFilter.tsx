import { Check } from "lucide-react";

import { FilterDropdown } from "@/components/filter-dropdown";
import { MAP_FILTER_DROPDOWN_MENU_Z_CLASS } from "@/lib/layout/mapDetailPanelLayout";
import {
  mapFilterChipActiveFilledClassName,
  mapFilterChipInactiveClassName,
} from "./map-chip-button";

import {
  RATING_OPTIONS,
  type OpenValue,
  type RatingValue,
} from "./map-filters";
import { cn } from "@/lib/utils";

type MapFilterProps = {
  rating: RatingValue;
  openNow: OpenValue;
  setRating: (v: RatingValue) => void;
  setOpenNow: (v: OpenValue) => void;
  onRatingDropdownOpenChange?: (open: boolean) => void;
  className?: string;
};

export default function MapFilter({
  rating,
  openNow,
  setRating,
  setOpenNow,
  onRatingDropdownOpenChange,
  className,
}: MapFilterProps) {
  const isOpenOnly = openNow === "open";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <FilterDropdown
        label="평점"
        options={RATING_OPTIONS}
        value={rating}
        onChange={setRating}
        onOpenChange={onRatingDropdownOpenChange}
        menuClassName={MAP_FILTER_DROPDOWN_MENU_Z_CLASS}
      />
      <button
        type="button"
        aria-pressed={isOpenOnly}
        onClick={() => setOpenNow(isOpenOnly ? "all" : "open")}
        className={cn(
          "inline-flex items-center gap-1",
          isOpenOnly
            ? mapFilterChipActiveFilledClassName()
            : mapFilterChipInactiveClassName(),
        )}
      >
        {isOpenOnly ? (
          <Check
            className="h-3.5 w-3.5 shrink-0"
            strokeWidth={2.5}
            aria-hidden
          />
        ) : null}
        영업 중
      </button>
    </div>
  );
}
