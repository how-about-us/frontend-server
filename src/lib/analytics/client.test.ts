import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/runtime", () => ({
  analyticsRuntime: {
    debugMode: false,
    enabled: true,
    measurementId: "G-TEST123",
  },
}));

async function freshClient(consent: "granted" | "denied") {
  vi.resetModules();
  const dataLayer: unknown[] = [];
  vi.stubGlobal("window", { dataLayer });
  vi.stubGlobal("document", {
    cookie: `uttae_analytics_consent=v1:${consent}`,
  });
  const client = await import("@/lib/analytics/client");
  return { client, dataLayer };
}

afterEach(() => vi.unstubAllGlobals());

function createUnpersistedCookieDocument(initialCookie: string) {
  const cookie = initialCookie;

  return {
    get cookie() {
      return cookie;
    },
    set cookie(_value: string) {},
  };
}

describe("buildGoogleAnalyticsConfig", () => {
  it("always disables automatic page views", async () => {
    const { client } = await freshClient("granted");
    expect(client.buildGoogleAnalyticsConfig(false)).toEqual({
      send_page_view: false,
    });
  });

  it("marks explicitly enabled debug traffic", async () => {
    const { client } = await freshClient("granted");
    expect(client.buildGoogleAnalyticsConfig(true)).toEqual({
      debug_mode: true,
      send_page_view: false,
    });
  });
});

describe("Google Consent Mode", () => {
  it("keeps advertising denied for both analytics choices", async () => {
    const { client } = await freshClient("granted");
    expect(client.buildGoogleAnalyticsConsentState("granted")).toEqual({
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "granted",
    });
    expect(
      client.buildGoogleAnalyticsConsentState("denied").analytics_storage,
    ).toBe("denied");
  });

  it("queues default, granted update, js, and config in order", async () => {
    const { client, dataLayer } = await freshClient("granted");

    client.initializeGoogleAnalytics("G-TEST123", false);

    expect(dataLayer).toEqual([
      [
        "consent",
        "default",
        client.buildGoogleAnalyticsConsentState("denied"),
      ],
      [
        "consent",
        "update",
        client.buildGoogleAnalyticsConsentState("granted"),
      ],
      ["js", expect.any(Date)],
      ["config", "G-TEST123", { send_page_view: false }],
    ]);
  });

  it("clears user id and denies storage, then re-grants without duplicate config", async () => {
    const { client, dataLayer } = await freshClient("granted");
    client.initializeGoogleAnalytics("G-TEST123", false);
    dataLayer.length = 0;

    client.revokeGoogleAnalyticsConsent();
    client.initializeGoogleAnalytics("G-TEST123", false);

    expect(dataLayer).toEqual([
      ["set", { user_id: null }],
      [
        "consent",
        "update",
        client.buildGoogleAnalyticsConsentState("denied"),
      ],
      [
        "consent",
        "update",
        client.buildGoogleAnalyticsConsentState("granted"),
      ],
    ]);
  });

  it("does not create gtag when rejecting before analytics initialization", async () => {
    const { client, dataLayer } = await freshClient("denied");
    client.revokeGoogleAnalyticsConsent();
    expect(dataLayer).toEqual([]);
    expect(window.gtag).toBeUndefined();
  });

  it("blocks page views unless consent is granted", async () => {
    const { client, dataLayer } = await freshClient("denied");
    client.trackAnalyticsPageView({
      page_location: "https://example.com/search",
      page_path: "/search",
      page_referrer: "",
      page_title: "검색",
    });
    expect(dataLayer).toEqual([]);

    document.cookie = "uttae_analytics_consent=v1:granted";
    client.trackAnalyticsPageView({
      page_location: "https://example.com/search",
      page_path: "/search",
      page_referrer: "",
      page_title: "검색",
    });
    expect(dataLayer).toEqual([
      [
        "event",
        "page_view",
        expect.objectContaining({ page_path: "/search" }),
      ],
    ]);
  });

  it("uses denied session state when a stale granted cookie cannot persist", async () => {
    vi.resetModules();
    const dataLayer: unknown[] = [];
    const cookieDocument = createUnpersistedCookieDocument(
      "uttae_analytics_consent=v1:granted",
    );
    vi.stubGlobal("window", {
      dataLayer,
      location: { hostname: "example.com", protocol: "http:" },
    });
    vi.stubGlobal("document", cookieDocument);
    const { analyticsConsentStore } = await import(
      "@/lib/analytics/consent-store"
    );
    const client = await import("@/lib/analytics/client");

    expect(analyticsConsentStore.set("denied")).toEqual({
      persisted: false,
      state: "denied",
    });
    client.trackAnalyticsPageView({
      page_location: "https://example.com/search",
      page_path: "/search",
      page_referrer: "",
      page_title: "검색",
    });

    expect(dataLayer).toEqual([]);
  });
});
