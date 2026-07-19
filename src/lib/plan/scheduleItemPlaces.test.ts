import { beforeAll, describe, expect, it } from "vitest";

import type {
  CreateScheduleItemResponse,
  RoomScheduleItem,
} from "@/lib/api/rooms/schedule-items";
import type { PlanPlace } from "@/lib/plan/types";

let applyRoomScheduleItemToPlanPlaces: typeof import("@/lib/plan/scheduleItemPlaces").applyRoomScheduleItemToPlanPlaces;
let mergeCreatedScheduleItemDelta: typeof import("@/lib/plan/scheduleItemPlaces").mergeCreatedScheduleItemDelta;

beforeAll(async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client";
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI = "http://localhost/callback";
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-maps-key";

  ({ applyRoomScheduleItemToPlanPlaces, mergeCreatedScheduleItemDelta } =
    await import("@/lib/plan/scheduleItemPlaces"));
});

const scheduleItem = (
  itemId: number,
  orderIndex: number,
  travelMode = "DRIVING",
): RoomScheduleItem => ({
  itemId,
  scheduleId: 10,
  googlePlaceId: `place-${itemId}`,
  startTime: null,
  durationMinutes: null,
  orderIndex,
  travelMode,
  createdAt: "2026-07-16T00:00:00Z",
});

const planPlace = (itemId: number, travelMode = "DRIVING"): PlanPlace => ({
  id: `item-${itemId}`,
  itemId,
  googlePlaceId: `place-${itemId}`,
  title: `Place ${itemId}`,
  travelMode,
});

describe("mergeCreatedScheduleItemDelta", () => {
  it("inserts the created item at the server-returned middle index", () => {
    const response: CreateScheduleItemResponse = {
      createdItem: scheduleItem(3, 1),
      updatedItems: [scheduleItem(2, 2)],
      affectedRouteItemIds: [1],
    };

    const next = mergeCreatedScheduleItemDelta(
      [planPlace(1), planPlace(2)],
      planPlace(3),
      response,
    );

    expect(next?.map((place) => place.itemId)).toEqual([1, 3, 2]);
  });

  it("applies the recommended travel mode from updatedItems", () => {
    const response: CreateScheduleItemResponse = {
      createdItem: scheduleItem(3, 1),
      updatedItems: [scheduleItem(1, 0, "WALKING"), scheduleItem(2, 2)],
      affectedRouteItemIds: [1],
    };

    const next = mergeCreatedScheduleItemDelta(
      [planPlace(1), planPlace(2)],
      planPlace(3),
      response,
    );

    expect(next?.[0]?.travelMode).toBe("WALKING");
  });

  it("returns null when an updated item is missing from the current cache", () => {
    const response: CreateScheduleItemResponse = {
      createdItem: scheduleItem(3, 1),
      updatedItems: [scheduleItem(99, 2)],
      affectedRouteItemIds: [1],
    };

    const next = mergeCreatedScheduleItemDelta(
      [planPlace(1), planPlace(2)],
      planPlace(3),
      response,
    );

    expect(next).toBeNull();
  });
});

describe("applyRoomScheduleItemToPlanPlaces", () => {
  it("clears cached start time and duration when the server returns null", () => {
    const prev: PlanPlace[] = [
      {
        id: "item-1",
        itemId: 1,
        googlePlaceId: "places/abc",
        title: "Old place",
        startTime: "09:00",
        durationMinutes: 90,
        travelMode: "WALKING",
      },
    ];
    const updated: RoomScheduleItem = {
      itemId: 1,
      scheduleId: 10,
      googlePlaceId: "places/abc",
      startTime: null,
      durationMinutes: null,
      orderIndex: 0,
      travelMode: "WALKING",
      createdAt: "2026-07-11T00:00:00Z",
    };

    const next = applyRoomScheduleItemToPlanPlaces(prev, updated);

    expect(next?.[0]).not.toHaveProperty("startTime");
    expect(next?.[0]).not.toHaveProperty("durationMinutes");
  });
});
