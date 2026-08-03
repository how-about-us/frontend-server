import { describe, expect, it } from "vitest";

import { filterVisibleMapBookmarks } from "./filter-visible-map-bookmarks";

describe("filterVisibleMapBookmarks", () => {
  it("일정에 포함되어 숨겨질 북마크를 preview 조회 대상에서 제외한다", () => {
    const rows = [
      { bookmarkId: 1, googlePlaceId: "places/ChIJ-hidden" },
      { bookmarkId: 2, googlePlaceId: "ChIJ-visible" },
    ];

    const result = filterVisibleMapBookmarks(rows, new Set(["ChIJ-hidden"]));

    expect(result).toEqual([{ bookmarkId: 2, googlePlaceId: "ChIJ-visible" }]);
  });
});
