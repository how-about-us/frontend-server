import { describe, expect, it } from "vitest";

import {
  AnalyticsEvents,
  buildAnalyticsUserIdCommand,
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
      joinPlan: "join_plan",
      viewPlace: "view_place",
      addToItinerary: "add_to_itinerary",
      removeFromItinerary: "remove_from_itinerary",
      reorderItinerary: "reorder_itinerary",
      search: "search",
      sharePlan: "share_plan",
      chatMessageSent: "chat_message_sent",
    });
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
