import type { LucideIcon } from "lucide-react";
import {
  UtensilsCrossed,
  BedDouble,
  Camera,
  Landmark,
  TrainFront,
} from "lucide-react";

/**
 * Google Maps Place types (Table A).
 * @see https://developers.google.com/maps/documentation/javascript/place-types
 */
export type MapPlaceCategory = {
  id: string;
  /** Chip label (UI, Korean — matches Google Maps-style copy) */
  label: string;
  /** 레거시/검색 문맥용 쿼리 문자열 */
  searchQuery: string;
  icon: LucideIcon;
  /** Nearby Search `includedPrimaryTypes` */
  googlePlaceTypeHint: string;
};

export const MAP_PLACE_CATEGORIES: MapPlaceCategory[] = [
  {
    id: "restaurant",
    label: "음식점",
    searchQuery: "음식점",
    icon: UtensilsCrossed,
    googlePlaceTypeHint: "restaurant",
  },
  {
    id: "lodging",
    label: "호텔",
    searchQuery: "호텔",
    icon: BedDouble,
    googlePlaceTypeHint: "lodging",
  },
  {
    id: "things_to_do",
    label: "즐길 거리",
    searchQuery: "관광명소 즐길거리",
    icon: Camera,
    googlePlaceTypeHint: "tourist_attraction",
  },
  {
    id: "museum",
    label: "박물관",
    searchQuery: "박물관",
    icon: Landmark,
    googlePlaceTypeHint: "museum",
  },
  {
    id: "transit",
    label: "대중교통",
    searchQuery: "지하철역 버스정류장",
    icon: TrainFront,
    googlePlaceTypeHint: "transit_station",
  },
];
