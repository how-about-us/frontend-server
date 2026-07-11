import { describe, expect, it, vi } from "vitest";

import type { PlaceDetail } from "@/lib/api/places";

import * as placeDetailDataModule from "./usePlaceDetailData";
import type { PlaceDetailResult } from "./types";

vi.mock("@/lib/places/place-queries", () => ({
  fetchPlaceDetail: vi.fn(),
  placeDetailQueryDefaults: {},
}));

type PlaceDetailDataModule = typeof placeDetailDataModule & {
  toPlaceDetailResult: (detail: PlaceDetail) => PlaceDetailResult;
};

describe("toPlaceDetailResult", () => {
  it("기존 googleMapsUri 대신 권장 placeUri를 장소 링크로 매핑한다", () => {
    expect(placeDetailDataModule).toHaveProperty("toPlaceDetailResult");

    const { toPlaceDetailResult } =
      placeDetailDataModule as PlaceDetailDataModule;
    const detail: PlaceDetail = {
      googlePlaceId: "ChIJ-test",
      name: "성수 카페",
      formattedAddress: "서울 성동구",
      location: { lat: 37.5, lng: 127.0 },
      primaryType: "cafe",
      primaryTypeDisplayName: "카페",
      rating: 4.7,
      userRatingCount: 128,
      phoneNumber: "02-123-4567",
      websiteUri: "https://example.com",
      googleMapsUri: "https://maps.google.com/legacy",
      googleMapsLinks: {
        placeUri: "https://maps.google.com/recommended-place",
        directionsUri: null,
        writeAReviewUri: null,
        reviewsUri: null,
        photosUri: null,
      },
      regularOpeningHours: null,
      photoNames: [],
      reviewSummary: null,
      reviews: [],
    };

    expect(toPlaceDetailResult(detail).placeUri).toBe(
      "https://maps.google.com/recommended-place",
    );
  });
});
