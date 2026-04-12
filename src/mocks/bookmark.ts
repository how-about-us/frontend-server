import type { SearchResultCardProps } from "@/components/place/SearchResultCard";
import { MOCK_SEARCH_RESULTS } from "./search";

export type BookmarkedPlace = SearchResultCardProps & { id: string };

export type BookmarkFolder = {
  id: string;
  title: string;
  /** Ribbon color (hex) */
  color: string;
  places: BookmarkedPlace[];
};

function makePlaces(folderId: string, count: number): BookmarkedPlace[] {
  return Array.from({ length: count }, (_, i) => {
    const base = MOCK_SEARCH_RESULTS[i % MOCK_SEARCH_RESULTS.length];
    return { ...base, id: `${folderId}-p${i}` };
  });
}

function makeFolder(
  id: string,
  title: string,
  color: string,
  placeCount: number,
): BookmarkFolder {
  return {
    id,
    title,
    color,
    places: makePlaces(id, placeCount),
  };
}

export const INITIAL_BOOKMARK_FOLDERS: BookmarkFolder[] = [
  makeFolder("bf-1", "제목 없는 북마크", "#EAB308", 23),
  makeFolder("bf-2", "제목 없는 북마크", "#14B8A6", 23),
  makeFolder("bf-3", "제목 없는 북마크", "#F12D33", 23),
  makeFolder("bf-4", "제목 없는 북마크", "#3B82F6", 23),
];
