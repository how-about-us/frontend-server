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

let persistedScheduleItemRouteQueryOptions: typeof import("@/lib/plan/scheduleItemRoutePersistedQuery").persistedScheduleItemRouteQueryOptions;
let registerQueryClient: typeof import("@/lib/query-client").registerQueryClient;
let getScheduleItemRouteMock: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client";
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI = "http://localhost/callback";
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-maps-key";

  ({ persistedScheduleItemRouteQueryOptions } = await import(
    "@/lib/plan/scheduleItemRoutePersistedQuery"
  ));
  ({ registerQueryClient } = await import("@/lib/query-client"));
  ({ getScheduleItemRoute: getScheduleItemRouteMock } = vi.mocked(
    await import("@/lib/api/rooms/schedule-items"),
  ));
});

beforeEach(() => {
  getScheduleItemRouteMock.mockReset();
});

describe("persistedScheduleItemRouteQueryOptions", () => {
  it("무효화된 경로 캐시가 있어도 API에서 최신 이동 정보를 조회한다", async () => {
    const queryClient = new QueryClient();
    registerQueryClient(queryClient);
    const options = persistedScheduleItemRouteQueryOptions(
      "room-1",
      10,
      1,
      "DRIVING",
      "",
      { segmentReady: true },
    );
    const staleRoute = {
      travelMode: "DRIVING",
      distanceMeters: 1200,
      durationSeconds: 300,
    };
    const freshRoute = {
      travelMode: "DRIVING",
      distanceMeters: 2400,
      durationSeconds: 600,
    };
    queryClient.setQueryData(options.queryKey, staleRoute);
    await queryClient.invalidateQueries({
      queryKey: options.queryKey,
      refetchType: "none",
    });
    getScheduleItemRouteMock.mockResolvedValue(freshRoute);

    const result = await queryClient.fetchQuery(options);

    expect(getScheduleItemRouteMock).toHaveBeenCalledOnce();
    expect(result).toEqual(freshRoute);
  });
});
