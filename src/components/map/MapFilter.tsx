import { FilterDropdown } from "@/components/globalUI/FilterDropdown";
import { cn } from "@/lib/utils";

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
          "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium shadow-md transition",
          isOpenOnly
            ? "bg-white text-brand-green ring-2 ring-brand-green ring-offset-1"
            : "bg-white text-black hover:bg-gray-50",
        )}
      >
        영업 중
      </button>
    </div>
  );
}
