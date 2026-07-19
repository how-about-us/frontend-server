import { sendGAEvent } from "@next/third-parties/google";

import { readAnalyticsConsentCookie } from "@/lib/analytics/consent-cookie";
import type {
  AnalyticsEntryPoint,
  AnalyticsRoomRole,
  ItemCountBucket,
  MemberCountBucket,
  ResultCountBucket,
  SearchRankBucket,
  TripDaysBucket,
} from "@/lib/analytics/context";

const shouldTrackAnalytics =
  process.env.NODE_ENV === "production" &&
  Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

export type AnalyticsUserIdCommand = [
  "set",
  { user_id: string | null },
];

export function buildAnalyticsUserIdCommand(
  userId: number | null | undefined,
): AnalyticsUserIdCommand {
  const normalized =
    typeof userId === "number" && Number.isSafeInteger(userId) && userId > 0
      ? String(userId)
      : null;
  return ["set", { user_id: normalized }];
}

export function setAnalyticsUserId(userId: number | null | undefined): void {
  if (!shouldTrackAnalytics) return;
  if (readAnalyticsConsentCookie() !== "granted") return;

  sendGAEvent(...buildAnalyticsUserIdCommand(userId));
}

export const AnalyticsEvents = {
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
} as const;

export type AnalyticsSource = "bookmark" | "chat" | "map" | "plan" | "search";

export type ItinerarySource = AnalyticsSource;

export type SharePlanMethod = "copy_link" | "native_share";

export type AnalyticsEventParams = {
  entry_point?: AnalyticsEntryPoint;
  item_count_bucket?: ItemCountBucket;
  member_count_bucket?: MemberCountBucket;
  message_type?: "ai" | "place" | "text";
  method?: "drag_drop" | "google" | SharePlanMethod;
  place_category?: string;
  rank_bucket?: SearchRankBucket;
  result_count_bucket?: ResultCountBucket;
  role?: AnalyticsRoomRole;
  search_mode?: "map_recenter" | "text";
  source?: AnalyticsSource;
  trip_days_bucket?: TripDaysBucket;
};

function cleanParams(
  params?: AnalyticsEventParams,
): Record<string, string | number | boolean> {
  if (!params) return {};
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export function trackAnalyticsEvent(
  eventName: (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents],
  params?: AnalyticsEventParams,
): void {
  if (!shouldTrackAnalytics) return;
  if (readAnalyticsConsentCookie() !== "granted") return;

  const cleaned = cleanParams(params);
  if (Object.keys(cleaned).length > 0) {
    sendGAEvent("event", eventName, cleaned);
  } else {
    sendGAEvent("event", eventName);
  }
}
