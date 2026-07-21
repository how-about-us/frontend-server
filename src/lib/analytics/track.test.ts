import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  AnalyticsEvents,
  type AnalyticsEventParamsMap,
  buildAnalyticsUserIdCommand,
  buildTutorialExitAnalyticsEvent,
} from "@/lib/analytics/track";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("AnalyticsEvents", () => {
  it("exposes the frontend GA event schema", () => {
    expect(AnalyticsEvents).toEqual({
      signUp: "sign_up",
      login: "login",
      createBookmarkFolder: "create_bookmark_folder",
      addToBookmark: "add_to_bookmark",
      createPlan: "create_plan",
      viewPlan: "view_plan",
      inviteView: "invite_view",
      joinPlan: "join_group",
      viewPlace: "view_place",
      addToItinerary: "add_to_itinerary",
      removeFromItinerary: "remove_from_itinerary",
      reorderItinerary: "reorder_itinerary",
      search: "view_search_results",
      sharePlan: "share",
      chatMessageSent: "chat_message_sent",
      tutorialBegin: "tutorial_begin",
      tutorialComplete: "tutorial_complete",
      tutorialSkip: "tutorial_skip",
    });
  });

  it("keeps search-result analytics free of raw search terms", () => {
    type SearchResultParams =
      AnalyticsEventParamsMap[typeof AnalyticsEvents.search];

    expectTypeOf<SearchResultParams>().toEqualTypeOf<{
      result_count_bucket: "0" | "1_5" | "6_20" | "21_plus";
      search_mode: "map_recenter" | "text";
    }>();
  });
});

describe("buildTutorialExitAnalyticsEvent", () => {
  it("builds the recommended completion event", () => {
    expect(buildTutorialExitAnalyticsEvent("complete", 5)).toEqual({
      eventName: "tutorial_complete",
      params: { tutorial_version: "sidebar_v1" },
    });
  });

  it("builds a skip event with the visible one-based step", () => {
    expect(buildTutorialExitAnalyticsEvent("skip", 2)).toEqual({
      eventName: "tutorial_skip",
      params: {
        skip_step: "3",
        tutorial_version: "sidebar_v1",
      },
    });
  });

  it.each([-1, 5])("rejects an invalid skip step index: %i", (stepIndex) => {
    expect(() =>
      buildTutorialExitAnalyticsEvent("skip", stepIndex),
    ).toThrow(RangeError);
  });
});

describe("buildAnalyticsUserIdCommand", () => {
  it("sets an opaque string user ID for an authenticated user", () => {
    expect(buildAnalyticsUserIdCommand(42)).toEqual([
      "set",
      { user_id: "42" },
    ]);
  });

  it.each([null, undefined, 0, Number.NaN])(
    "clears the user ID for an invalid or signed-out value: %s",
    (userId) => {
      expect(buildAnalyticsUserIdCommand(userId)).toEqual([
        "set",
        { user_id: null },
      ]);
    },
  );
});

describe("analytics consent gate", () => {
  it("blocks an event after denial and sends it after grant", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_DEBUG_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-TEST123");
    vi.stubGlobal("window", { dataLayer: [] as unknown[] });
    vi.stubGlobal("document", {
      cookie: "uttae_analytics_consent=v1:denied",
    });
    vi.resetModules();
    const { AnalyticsEvents, trackAnalyticsEvent } = await import(
      "@/lib/analytics/track"
    );

    trackAnalyticsEvent(AnalyticsEvents.createBookmarkFolder);
    expect(window.dataLayer).toEqual([]);

    document.cookie = "uttae_analytics_consent=v1:granted";
    trackAnalyticsEvent(AnalyticsEvents.createBookmarkFolder);
    expect(window.dataLayer).toEqual([
      ["event", "create_bookmark_folder"],
    ]);
  });
});
