import type { FilterOption } from "@/components/filter-dropdown";

export type RatingValue = "all" | "3.0" | "3.5" | "4.0" | "4.5";
export type OpenValue = "all" | "open";

export const RATING_OPTIONS: FilterOption<RatingValue>[] = [
  { label: "전체", value: "all" },
  { label: "3.0 이상", value: "3.0" },
  { label: "3.5 이상", value: "3.5" },
  { label: "4.0 이상", value: "4.0" },
  { label: "4.5 이상", value: "4.5" },
];
