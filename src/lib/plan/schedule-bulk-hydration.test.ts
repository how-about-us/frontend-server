import { QueryClient } from "@tanstack/react-query";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanPlace } from "@/lib/plan/types";

vi.mock("@/lib/api/rooms/schedule-items", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/rooms/schedule-items")>();
  return {
    ...actual,
    getScheduleItemRoutesBatch: vi.fn(),
  };
});

let hydrateScheduleRoutesBatch: typeof import("@/lib/plan/schedule-bulk-hydration").hydrateScheduleRoutesBatch;
let scheduleItemsQueryKey: typeof import("@/lib/query-keys").scheduleItemsQueryKey;
let scheduleItemRouteQueryKey: typeof import("@/lib/query-keys").scheduleItemRouteQueryKey;
let getScheduleItemRoutesBatchMock: ReturnType<typeof vi.fn>;

const ROOM_ID = "room-1";
const SCHEDULE_ID = 10;

function place(itemId: number, googlePlaceId: string): PlanPlace {
  return {
    id: `item-${itemId}`,
    itemId,
    googlePlaceId,
    title: googlePlaceId,
  };
}

beforeAll(async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client";
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI = "http://localhost/callback";
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-maps-key";

  ({ hydrateScheduleRoutesBatch } = await import(
    "@/lib/plan/schedule-bulk-hydration"
  ));
  ({ scheduleItemsQueryKey, scheduleItemRouteQueryKey } = await import(
    "@/lib/query-keys"
  ));
  ({ getScheduleItemRoutesBatch: getScheduleItemRoutesBatchMock } =
    vi.mocked(await import("@/lib/api/rooms/schedule-items")));
});

beforeEach(() => {
  getScheduleItemRoutesBatchMock.mockReset();
});

describe("hydrateScheduleRoutesBatch", () => {
  const snapshot = [place(1, "places/a"), place(2, "places/b")];
  const routeResult = {
    status: "OK" as const,
    itemId: 1,
    travelMode: "DRIVING",
    distanceMeters: 1200,
    durationSeconds: 300,
    encodedPolyline: "_p~iF~ps|U_ulLnnqC",
  };

  it("응답 시점에 일정 지문이 그대로면 경로를 시딩한다", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      scheduleItemsQueryKey(ROOM_ID, SCHEDULE_ID),
      snapshot,
    );
    getScheduleItemRoutesBatchMock.mockResolvedValue([routeResult]);

    await hydrateScheduleRoutesBatch(queryClient, ROOM_ID, SCHEDULE_ID, snapshot);

    expect(
      queryClient.getQueryData(
        scheduleItemRouteQueryKey(ROOM_ID, SCHEDULE_ID, 1, "DRIVING"),
      ),
    ).toMatchObject({
      distanceMeters: 1200,
      durationSeconds: 300,
      encodedPolyline: "_p~iF~ps|U_ulLnnqC",
    });
  });

  it("폴리라인이 없는 구간은 encodedPolyline 없이 시딩한다", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      scheduleItemsQueryKey(ROOM_ID, SCHEDULE_ID),
      snapshot,
    );
    const { encodedPolyline: _omitted, ...withoutPolyline } = routeResult;
    getScheduleItemRoutesBatchMock.mockResolvedValue([withoutPolyline]);

    await hydrateScheduleRoutesBatch(queryClient, ROOM_ID, SCHEDULE_ID, snapshot);

    expect(
      queryClient.getQueryData(
        scheduleItemRouteQueryKey(ROOM_ID, SCHEDULE_ID, 1, "DRIVING"),
      ),
    ).not.toHaveProperty("encodedPolyline");
  });

  it("응답 대기 중 일정이 바뀌면(지문 불일치) 늦게 도착한 결과를 버린다", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      scheduleItemsQueryKey(ROOM_ID, SCHEDULE_ID),
      snapshot,
    );
    getScheduleItemRoutesBatchMock.mockImplementation(async () => {
      // batch 응답이 도착하기 전에 목적지가 B → C 로 교체된 상황
      queryClient.setQueryData(scheduleItemsQueryKey(ROOM_ID, SCHEDULE_ID), [
        place(1, "places/a"),
        place(3, "places/c"),
      ]);
      return [routeResult];
    });

    await hydrateScheduleRoutesBatch(queryClient, ROOM_ID, SCHEDULE_ID, snapshot);

    expect(
      queryClient.getQueryData(
        scheduleItemRouteQueryKey(ROOM_ID, SCHEDULE_ID, 1, "DRIVING"),
      ),
    ).toBeUndefined();
  });
});
