import type { SearchResultCardProps } from "@/components/place/SearchResultCard";

export type BookmarkedPlace = SearchResultCardProps & { id: string };

export type BookmarkFolder = {
  id: string;
  title: string;
  /** Ribbon color (hex) */
  color: string;
  places: BookmarkedPlace[];
  /** Server-reported count; may differ from `places.length` until places are loaded. */
  placeCount?: number;
};
