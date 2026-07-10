import { beforeAll, describe, expect, it } from "vitest";

import type { RoomScheduleItem } from "@/lib/api/rooms/schedule-items";
import type { PlanPlace } from "@/lib/plan/types";

let applyRoomScheduleItemToPlanPlaces: typeof import("@/lib/plan/scheduleItemPlaces").applyRoomScheduleItemToPlanPlaces;

beforeAll(async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client";
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI = "http://localhost/callback";
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-maps-key";

  ({ applyRoomScheduleItemToPlanPlaces } = await import(
    "@/lib/plan/scheduleItemPlaces"
  ));
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
