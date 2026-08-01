import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import { HeroImage } from "./HeroSection";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:8080";
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID = "test-client";
  process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI = "http://localhost/callback";
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-maps-key";
});

describe("HeroImage", () => {
  it("상세 사진은 photoUrl 쿼리 하나만 생성한다", () => {
    const googlePlaceId = "ChIJ-detail-place";
    const photoUrl = "https://cdn.example/detail.jpg";
    const queryClient = new QueryClient();
    queryClient.setQueryData(["places", "photoUrl", googlePlaceId], photoUrl);

    const html = renderToStaticMarkup(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(HeroImage, {
          googlePlaceId,
          name: "후글렌 도쿄 시부야",
        }),
      ),
    );

    expect(html).toContain(`src="${photoUrl}"`);
    expect(
      queryClient
        .getQueryCache()
        .findAll({ queryKey: ["places", "photoUrl"] }),
    ).toHaveLength(1);
    expect(
      queryClient
        .getQueryCache()
        .findAll({ queryKey: ["places", "photoUrlsSeed"] }),
    ).toHaveLength(0);
  });
});
