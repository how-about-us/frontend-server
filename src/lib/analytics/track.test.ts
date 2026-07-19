import { describe, expect, it } from "vitest";

import { AnalyticsEvents } from "@/lib/analytics/track";

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
