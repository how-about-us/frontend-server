import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/components/analytics/AmplitudeAnalytics", () => ({
  AmplitudeAnalytics: () => <div data-amplitude-analytics />,
}));

vi.mock("@/components/analytics/CookieConsentBanner", () => ({
  CookieConsentBanner: () => null,
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

it("mounts the Amplitude client only after analytics consent", () => {
  const html = renderToStaticMarkup(
    <ConsentGatedAnalytics debugMode={false} gaId="">
      <div data-route-tracker />
    </ConsentGatedAnalytics>,
  );

  expect(html).toContain("data-amplitude-analytics");
});
