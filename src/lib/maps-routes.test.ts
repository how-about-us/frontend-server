import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchPlanSegmentPathLatLng } from "./maps";

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
});
