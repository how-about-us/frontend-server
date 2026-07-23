import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/analytics/AnalyticsRouteTracker", () => ({
  AnalyticsRouteTracker: () => <div data-tracker="session" />,
  AnonymousAnalyticsRouteTracker: () => <div data-tracker="anonymous" />,
}));

vi.mock("@/components/analytics/CookieConsentBanner", () => ({
  CookieConsentBanner: () => <div data-consent-banner />,
}));

vi.mock("@/components/analytics/GoogleAnalyticsScript", () => ({
  GoogleAnalyticsScript: () => <div data-google-analytics />,
}));

vi.mock("@/lib/analytics/consent-actions", () => ({
  denyAnalyticsConsent: vi.fn(),
  grantAnalyticsConsent: vi.fn(),
}));

vi.mock("@/lib/analytics/consent-store", () => ({
  analyticsConsentStore: {
    getServerSnapshot: () => "granted",
    getSnapshot: () => "granted",
    subscribe: () => () => {},
  },
}));

import { ConsentGatedAnalytics } from "@/components/analytics/ConsentGatedAnalytics";

describe("ConsentGatedAnalytics", () => {
  it("uses the anonymous tracker without mounting the session tracker", () => {
    const html = renderToStaticMarkup(
      <ConsentGatedAnalytics anonymous debugMode={false} gaId="G-TEST" />,
    );

    expect(html).toContain('data-tracker="anonymous"');
    expect(html).not.toContain('data-tracker="session"');
  });

  it("retains session-aware tracking for the app stack", () => {
    const html = renderToStaticMarkup(
      <ConsentGatedAnalytics debugMode={false} gaId="G-TEST" />,
    );

    expect(html).toContain('data-tracker="session"');
    expect(html).not.toContain('data-tracker="anonymous"');
  });
});
