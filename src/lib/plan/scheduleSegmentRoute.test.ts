import { QueryClient } from "@tanstack/react-query";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api/rooms/schedule-items", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/api/rooms/schedule-items")>();
  return {
    ...actual,
    getScheduleItemRoute: vi.fn(),
  };
});

let resolveScheduleSegmentRoute: typeof import("@/lib/plan/scheduleSegmentRoute").resolveScheduleSegmentRoute;
let scheduleItemRouteQueryKey: typeof import("@/lib/query-keys").scheduleItemRouteQueryKey;
let registerQueryClient: typeof import("@/lib/query-client").registerQueryClient;
let getScheduleItemRouteMock: ReturnType<typeof vi.fn>;

const ROOM_ID = "room-1";
const SCHEDULE_ID = 10;
const ITEM_ID = 1;

const ROUTE = {
  distanceMeters: 1200,
  durationSeconds: 300,
  travelMode: "DRIVING",
  encodedPolyline: "_p~iF~ps|U_ulLnnqC",
};

let queryClient: QueryClient;

beforeAll(async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client";
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI = "http://localhost/callback";
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-maps-key";

  ({ resolveScheduleSegmentRoute } = await import(
    "@/lib/plan/scheduleSegmentRoute"
  ));
  ({ scheduleItemRouteQueryKey } = await import("@/lib/query-keys"));
  ({ registerQueryClient } = await import("@/lib/query-client"));
  ({ getScheduleItemRoute: getScheduleItemRouteMock } = vi.mocked(
    await import("@/lib/api/rooms/schedule-items"),
  ));
});

beforeEach(() => {
  getScheduleItemRouteMock.mockReset();
  queryClient = new QueryClient();
  registerQueryClient(queryClient);
});

function resolve() {
  return resolveScheduleSegmentRoute({
    roomId: ROOM_ID,
    scheduleId: SCHEDULE_ID,
    segmentSourceItemId: ITEM_ID,
    travelMode: "DRIVING",
  });
}

describe("resolveScheduleSegmentRoute", () => {
  it("구간 캐시에 값이 있으면 단건 GET을 하지 않는다", async () => {
    queryClient.setQueryData(
      scheduleItemRouteQueryKey(ROOM_ID, SCHEDULE_ID, ITEM_ID, "DRIVING"),
      ROUTE,
    );

    await expect(resolve()).resolves.toEqual(ROUTE);
    expect(getScheduleItemRouteMock).not.toHaveBeenCalled();
  });

  it("캐시 miss면 단건 GET 결과를 구간 캐시에 되쓴다", async () => {
    getScheduleItemRouteMock.mockResolvedValue(ROUTE);

    await expect(resolve()).resolves.toEqual(ROUTE);

    expect(
      queryClient.getQueryData(
        scheduleItemRouteQueryKey(ROOM_ID, SCHEDULE_ID, ITEM_ID, "DRIVING"),
      ),
    ).toEqual(ROUTE);
  });

  it("같은 구간을 동시에 조회해도 단건 GET은 한 번만 나간다", async () => {
    getScheduleItemRouteMock.mockImplementation(
      () => new Promise((res) => setTimeout(() => res(ROUTE), 10)),
    );

    const [a, b] = await Promise.all([resolve(), resolve()]);

    expect(a).toEqual(ROUTE);
    expect(b).toEqual(ROUTE);
    expect(getScheduleItemRouteMock).toHaveBeenCalledTimes(1);
  });

  it("경로 없음(204)은 null로 캐시해 재조회하지 않는다", async () => {
    getScheduleItemRouteMock.mockResolvedValue(null);

    await expect(resolve()).resolves.toBeNull();
    await expect(resolve()).resolves.toBeNull();

    expect(getScheduleItemRouteMock).toHaveBeenCalledTimes(1);
  });
});
