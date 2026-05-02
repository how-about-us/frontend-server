import type { SearchResultCardProps } from "@/components/place/SearchResultCard";

/** One saved place in a folder (card props + server bookmark row id as string). */
export type BookmarkedPlace = SearchResultCardProps & { id: string };

/** Bookmark category as shown in the folder list / detail header (from API categories). */
export type BookmarkFolder = {
  id: string;
  title: string;
  /** Ribbon color (hex) */
  color: string;
  placeCount?: number;
};
