import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildPlanItineraryRouteConnectorDotIcons,
  buildPlanItineraryRouteConnectorPaths,
  fetchPlanSegmentPathLatLng,
} from "./maps";

describe("fetchPlanSegmentPathLatLng", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("Place ID로 Route를 계산하고 overview path 좌표를 반환한다", async () => {
    const placeIds: string[] = [];
    class Place {
      constructor({ id }: { id: string }) {
        placeIds.push(id);
      }
    }

    const computeRoutes = vi.fn().mockResolvedValue({
      routes: [
        {
          path: [
            { lat: 37.5665, lng: 126.978, altitude: 0 },
            { lat: 37.5446, lng: 127.0557, altitude: 0 },
          ],
        },
      ],
      fallbackInfo: null,
      geocodingResults: null,
    });
    const importLibrary = vi.fn(async (name: string) => {
      if (name === "places") return { Place };
      if (name === "routes") return { Route: { computeRoutes } };
      throw new Error(`unexpected library: ${name}`);
    });

    vi.stubGlobal("google", {
      maps: {
        importLibrary,
        TravelMode: {
          WALKING: "WALKING",
          DRIVING: "DRIVING",
          BICYCLING: "BICYCLING",
          TRANSIT: "TRANSIT",
        },
      },
    });

    await expect(
      fetchPlanSegmentPathLatLng(
        " ChIJ-origin ",
        " ChIJ-destination ",
        "DRIVING",
      ),
    ).resolves.toEqual([
      { lat: 37.5665, lng: 126.978 },
      { lat: 37.5446, lng: 127.0557 },
    ]);
    expect(placeIds).toEqual(["ChIJ-origin", "ChIJ-destination"]);
    expect(computeRoutes).toHaveBeenCalledWith({
      origin: expect.any(Place),
      destination: expect.any(Place),
      travelMode: "DRIVING",
      fields: ["path"],
      polylineQuality: "OVERVIEW",
    });
  });

  it("이동수단이 누락되면 일정 기본값 DRIVING으로 경로를 계산한다", async () => {
    class Place {}
    const computeRoutes = vi.fn().mockResolvedValue({
      routes: [{ path: [] }],
      fallbackInfo: null,
      geocodingResults: null,
    });
    const importLibrary = vi.fn(async (name: string) => {
      if (name === "places") return { Place };
      if (name === "routes") return { Route: { computeRoutes } };
      throw new Error(`unexpected library: ${name}`);
    });

    vi.stubGlobal("google", {
      maps: {
        importLibrary,
        TravelMode: {
          WALKING: "WALKING",
          DRIVING: "DRIVING",
          BICYCLING: "BICYCLING",
          TRANSIT: "TRANSIT",
        },
      },
    });

    await fetchPlanSegmentPathLatLng("origin", "destination", undefined);

    expect(computeRoutes).toHaveBeenCalledWith(
      expect.objectContaining({ travelMode: "DRIVING" }),
    );
  });

  it("경로 계산에 실패하면 빈 경로를 반환한다", async () => {
    const importLibrary = vi.fn(async (name: string) => {
      if (name === "places") {
        return { Place: class Place {} };
      }
      if (name === "routes") {
        return {
          Route: {
            computeRoutes: vi.fn().mockRejectedValue(new Error("routes error")),
          },
        };
      }
      throw new Error(`unexpected library: ${name}`);
    });

    vi.stubGlobal("google", {
      maps: {
        importLibrary,
        TravelMode: {
          WALKING: "WALKING",
          DRIVING: "DRIVING",
          BICYCLING: "BICYCLING",
          TRANSIT: "TRANSIT",
        },
      },
    });

    await expect(
      fetchPlanSegmentPathLatLng("origin", "destination", "WALKING"),
    ).resolves.toEqual([]);
  });

  it("점선 보조 구간은 큰 점과 80% 불투명도로 표시한다", () => {
    const [dotSequence] = buildPlanItineraryRouteConnectorDotIcons("#123456");

    expect(dotSequence?.icon).toEqual(
      expect.objectContaining({
        fillColor: "#123456",
        fillOpacity: 0.8,
        scale: 5,
      }),
    );
  });
});

describe("buildPlanItineraryRouteConnectorPaths", () => {
  it("경로 path가 실제 장소 좌표까지 닿지 않으면 양끝을 점선 보조 구간으로 연결한다", () => {
    const origin = { lat: 37.5665, lng: 126.978 };
    const dest = { lat: 37.5446, lng: 127.0557 };
    const path = [
      { lat: 37.567, lng: 126.979 },
      { lat: 37.545, lng: 127.0548 },
    ];

    expect(
      buildPlanItineraryRouteConnectorPaths({
        path,
        origin,
        dest,
      }),
    ).toEqual([
      [origin, path[0]],
      [path[1], dest],
    ]);
  });

  it("경로 path를 만들 수 없으면 실제 장소 좌표 사이를 점선 직선으로 연결한다", () => {
    const origin = { lat: 37.5665, lng: 126.978 };
    const dest = { lat: 37.5446, lng: 127.0557 };

    expect(
      buildPlanItineraryRouteConnectorPaths({
        path: [],
        origin,
        dest,
      }),
    ).toEqual([[origin, dest]]);
  });
});
