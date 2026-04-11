import type { FilterOption } from "@/components/globalUI/FilterDropdown";

export type PriceValue = "all" | "₩" | "₩₩" | "₩₩₩" | "₩₩₩₩";
export type RatingValue = "all" | "3.0" | "3.5" | "4.0" | "4.5";
export type OpenValue = "all" | "open";

export const PRICE_OPTIONS: FilterOption<PriceValue>[] = [
  { label: "전체", value: "all" },
  { label: "₩  저렴해요", value: "₩" },
  { label: "₩₩  보통이에요", value: "₩₩" },
  { label: "₩₩₩  비싸요", value: "₩₩₩" },
  { label: "₩₩₩₩  매우 비싸요", value: "₩₩₩₩" },
];

export const RATING_OPTIONS: FilterOption<RatingValue>[] = [
  { label: "전체", value: "all" },
  { label: "3.0 이상", value: "3.0" },
  { label: "3.5 이상", value: "3.5" },
  { label: "4.0 이상", value: "4.0" },
  { label: "4.5 이상", value: "4.5" },
];

export const OPEN_OPTIONS: FilterOption<OpenValue>[] = [
  { label: "전체", value: "all" },
  { label: "지금 영업 중", value: "open" },
];
