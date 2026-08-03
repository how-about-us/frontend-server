import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

vi.mock("@/lib/places/place-queries", () => ({
  placePreviewQueryOptions: (googlePlaceId: string) => ({
    queryKey: ["places", "preview", googlePlaceId],
    queryFn: async () => ({ googlePlaceId }),
    enabled: googlePlaceId.trim().length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  }),
}));

vi.mock("@/lib/places/place-batch-cache", () => ({
  fetchAndSeedPlacePreviews: vi.fn(),
}));

import {
  buildMapBookmarkPreviewPlan,
  mapBookmarkPreviewQueryOptions,
  settleMapBookmarkPreviewBatch,
} from "./map-bookmark-preview-query";

describe("mapBookmarkPreviewQueryOptions", () => {
  it("벌크 preview 시딩이 끝나기 전에는 개별 preview 요청을 비활성화한다", () => {
    const options = mapBookmarkPreviewQueryOptions("ChIJ-bookmark", false);

    expect(options.enabled).toBe(false);
  });

  it("벌크 preview 시딩이 끝난 뒤에는 캐시 miss 개별 조회를 허용한다", () => {
    const options = mapBookmarkPreviewQueryOptions("ChIJ-bookmark", true);

    expect(options.enabled).toBe(true);
  });

  it("숨길 북마크를 제외하고 벌크가 끝날 때까지 개별 조회를 차단한다", () => {
    const rows = [
      { bookmarkId: 1, googlePlaceId: "places/ChIJ-hidden" },
      { bookmarkId: 2, googlePlaceId: "ChIJ-visible" },
    ];

    const pendingPlan = buildMapBookmarkPreviewPlan(
      rows,
      new Set(["ChIJ-hidden"]),
      null,
    );

    expect(pendingPlan.visibleBookmarks).toEqual([rows[1]]);
    expect(pendingPlan.previewIdsKey).toBe("ChIJ-visible");
    expect(pendingPlan.queryOptions.map((options) => options.enabled)).toEqual([
      false,
    ]);

    const settledPlan = buildMapBookmarkPreviewPlan(
      rows,
      new Set(["ChIJ-hidden"]),
      pendingPlan.previewIdsKey,
    );
    expect(settledPlan.queryOptions.map((options) => options.enabled)).toEqual([
      true,
    ]);
  });

  it("현재 ID 벌크가 정착한 뒤에만 해당 key를 반환하고 실패해도 fallback을 연다", async () => {
    const queryClient = new QueryClient();
    let resolveBatch: (() => void) | undefined;
    const loader = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveBatch = resolve;
        }),
    );

    const settlement = settleMapBookmarkPreviewBatch(
      "ChIJ-a\u0000ChIJ-b",
      queryClient,
      loader,
    );
    let settled = false;
    void settlement.then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(loader).toHaveBeenCalledWith(["ChIJ-a", "ChIJ-b"], queryClient);
    expect(settled).toBe(false);

    resolveBatch?.();
    await expect(settlement).resolves.toBe("ChIJ-a\u0000ChIJ-b");

    const failedLoader = vi.fn().mockRejectedValue(new Error("batch failed"));
    await expect(
      settleMapBookmarkPreviewBatch("ChIJ-c", queryClient, failedLoader),
    ).resolves.toBe("ChIJ-c");
  });
});
