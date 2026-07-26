import { describe, expect, it, vi } from "vitest";

import { searchPlaces } from "@/lib/api/places";

import { fetchPlacesPageWithPhotos } from "./usePlacesSearch";

vi.mock("@/lib/api/places", () => ({
  searchPlaces: vi.fn(),
}));

describe("fetchPlacesPageWithPhotos", () => {
  it("검색 결과에서는 사진 URL을 미리 batch로 요청하지 않고 photoName만 반환한다", async () => {
    vi.mocked(searchPlaces).mockResolvedValueOnce({
      nextPageToken: null,
      items: [
        {
          googlePlaceId: "places/abc",
          name: "성수 카페",
          formattedAddress: "서울 성동구",
          location: { lat: 37.5, lng: 127 },
          primaryType: "cafe",
          primaryTypeDisplayName: "카페",
          rating: 4.6,
          userRatingCount: 12,
          openNow: true,
          photoName: "places/abc/photos/one",
        },
      ],
    });

    const page = await fetchPlacesPageWithPhotos({
      query: "카페",
      latitude: 37.5,
      longitude: 127,
      radius: 1000,
      pageSize: 20,
      pageToken: undefined,
    });

    expect(page.items[0]).toEqual(
      expect.objectContaining({
        googlePlaceId: "places/abc",
        name: "성수 카페",
        photoName: "places/abc/photos/one",
      }),
    );
    expect(page.items[0]).not.toHaveProperty("image");
  });
});
