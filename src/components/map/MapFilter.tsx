import { Check } from "lucide-react";

import { FilterDropdown } from "@/components/filter-dropdown";
import { cn } from "@/lib/utils";

import { mapChipButtonClassName } from "./map-chip-button";

import {
  RATING_OPTIONS,
  type OpenValue,
  type RatingValue,
} from "./map-filters";

type MapFilterProps = {
  rating: RatingValue;
  openNow: OpenValue;
  setRating: (v: RatingValue) => void;
  setOpenNow: (v: OpenValue) => void;
  className?: string;
};

export default function MapFilter({
  rating,
  openNow,
  setRating,
  setOpenNow,
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
      />
      <button
        type="button"
        aria-pressed={isOpenOnly}
        onClick={() => setOpenNow(isOpenOnly ? "all" : "open")}
        className={cn(
          "inline-flex items-center gap-1",
          mapChipButtonClassName(!isOpenOnly),
        )}
      >
        {isOpenOnly ? (
          <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
        ) : null}
        영업 중
      </button>
    </div>
  );
}
