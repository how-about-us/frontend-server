import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requestPlacePhotoUrl = vi.fn();

vi.mock("@/lib/api/places", () => ({
  requestPlacePhotoUrl,
}));

describe("refreshPlacePhotoUrl", () => {
  beforeEach(() => {
    requestPlacePhotoUrl.mockReset();
    vi.restoreAllMocks();
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

  it("logs a readable error message when image refresh fails", async () => {
    const { handlePlacePhotoImageError } = await import(
      "@/lib/places/place-photo-refresh"
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    requestPlacePhotoUrl.mockRejectedValueOnce(new Error("Place photo failed: 500"));
    const image = {
      src: "https://example.invalid/broken.jpg",
      currentSrc: "https://example.invalid/broken.jpg",
      complete: true,
      naturalWidth: 0,
      naturalHeight: 0,
      dataset: {},
      isConnected: true,
    } as HTMLImageElement;

    handlePlacePhotoImageError({
      source: "chat-og-place-card",
      googlePlaceId: "ChIJ-place-1",
      placeName: "고세이병원",
      image,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(warn).toHaveBeenCalledWith(
      "[PHOTO-URL] refresh failed",
      expect.objectContaining({
        errorMessage: "Place photo failed: 500",
        googlePlaceId: "ChIJ-place-1",
      }),
    );
  });

  it("logs when image refresh returns no URL", async () => {
    const { handlePlacePhotoImageError } = await import(
      "@/lib/places/place-photo-refresh"
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    requestPlacePhotoUrl.mockResolvedValueOnce("");
    const image = {
      src: "https://example.invalid/broken.jpg",
      currentSrc: "https://example.invalid/broken.jpg",
      complete: true,
      naturalWidth: 0,
      naturalHeight: 0,
      dataset: {},
      isConnected: true,
    } as HTMLImageElement;

    handlePlacePhotoImageError({
      source: "chat-og-place-card",
      googlePlaceId: "ChIJ-place-1",
      placeName: "고세이병원",
      image,
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(warn).toHaveBeenCalledWith(
      "[PHOTO-URL] refresh empty",
      expect.objectContaining({
        googlePlaceId: "ChIJ-place-1",
        source: "chat-og-place-card",
      }),
    );
  });
});
