import { describe, expect, it } from "vitest";

import {
  AnalyticsEvents,
  buildAnalyticsUserIdCommand,
  buildTutorialExitAnalyticsEvent,
} from "@/lib/analytics/track";

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
      search: "search",
      sharePlan: "share",
      chatMessageSent: "chat_message_sent",
      tutorialBegin: "tutorial_begin",
      tutorialComplete: "tutorial_complete",
      tutorialSkip: "tutorial_skip",
    });
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
