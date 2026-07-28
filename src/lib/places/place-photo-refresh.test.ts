import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requestPlacePhotoUrl = vi.fn();

vi.mock("@/lib/api/places", () => ({
  requestPlacePhotoUrl,
}));

describe("refreshPlacePhotoUrl", () => {
  beforeEach(() => {
    requestPlacePhotoUrl.mockReset();
  });

  it("requests a refreshed photo URL and replaces the place photo query cache", async () => {
    const { placePhotoUrlQueryKey } = await import("@/lib/place-photo-query");
    const { refreshPlacePhotoUrl } = await import(
      "@/lib/places/place-photo-refresh"
    );
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      placePhotoUrlQueryKey("ChIJ-place-1"),
      "https://example.invalid/broken.jpg",
    );
    requestPlacePhotoUrl.mockResolvedValueOnce("https://cdn.example/fresh.jpg");

    const refreshed = await refreshPlacePhotoUrl(" ChIJ-place-1 ", queryClient);

    expect(refreshed).toBe("https://cdn.example/fresh.jpg");
    expect(requestPlacePhotoUrl).toHaveBeenCalledWith("ChIJ-place-1", {
      refresh: true,
    });
    expect(queryClient.getQueryData(placePhotoUrlQueryKey("ChIJ-place-1"))).toBe(
      "https://cdn.example/fresh.jpg",
    );
  });
});
