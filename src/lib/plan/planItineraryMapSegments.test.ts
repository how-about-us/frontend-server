import { expect, test } from "vitest";

import { flattenPlanItinerarySegmentsFromPlaces } from "./planItineraryMapSegments";

test("구간별 선택 이동수단을 지도 경로 descriptor에 반영한다", () => {
  const [segment] = flattenPlanItinerarySegmentsFromPlaces(
    [7],
    [
      [
        {
          id: "a",
          itemId: 10,
          title: "출발",
          googlePlaceId: "origin",
          travelMode: "WALKING",
        },
        { id: "b", itemId: 11, title: "도착", googlePlaceId: "destination" },
      ],
    ],
  );

  expect(segment?.travelModeCanon).toBe("WALKING");
});
