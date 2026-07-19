import { describe, expect, it } from "vitest";

import { buildGoogleAnalyticsConfig } from "@/lib/analytics/client";

describe("buildGoogleAnalyticsConfig", () => {
  it("always disables automatic page views", () => {
    expect(buildGoogleAnalyticsConfig(false)).toEqual({
      send_page_view: false,
    });
  });

  it("marks explicitly enabled debug traffic", () => {
    expect(buildGoogleAnalyticsConfig(true)).toEqual({
      debug_mode: true,
      send_page_view: false,
    });
  });
});
