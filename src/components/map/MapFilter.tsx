import { FilterDropdown } from "@/components/globalUI/FilterDropdown";

import {
  PRICE_OPTIONS,
  RATING_OPTIONS,
  OPEN_OPTIONS,
  type OpenValue,
  type PriceValue,
  type RatingValue,
} from "./map-filters";

type MapFilterProps = {
  price: PriceValue;
  rating: RatingValue;
  openNow: OpenValue;
  setPrice: (v: PriceValue) => void;
  setRating: (v: RatingValue) => void;
  setOpenNow: (v: OpenValue) => void;
};

export default function MapFilter({
  price,
  rating,
  openNow,
  setPrice,
  setRating,
  setOpenNow,
}: MapFilterProps) {
  return (
    <div className="pointer-events-none absolute left-0 right-0 top-0 mt-4 flex px-4">
      <div className="pointer-events-auto flex gap-2">
        <FilterDropdown
          label="가격"
          options={PRICE_OPTIONS}
          value={price}
          onChange={setPrice}
        />
        <FilterDropdown
          label="평점"
          options={RATING_OPTIONS}
          value={rating}
          onChange={setRating}
        />
        <FilterDropdown
          label="영업시간"
          options={OPEN_OPTIONS}
          value={openNow}
          onChange={setOpenNow}
        />
      </div>
    </div>
  );
}
