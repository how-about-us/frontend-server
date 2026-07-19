import { sendAnalyticsCommand } from "@/lib/analytics/client";

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
import { analyticsRuntime } from "@/lib/analytics/runtime";

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
  if (!analyticsRuntime.enabled) return;
  if (readAnalyticsConsentCookie() !== "granted") return;

  sendAnalyticsCommand(...buildAnalyticsUserIdCommand(userId));
}

export const AnalyticsEvents = {
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
} as const;

export type AnalyticsSource = "bookmark" | "chat" | "map" | "plan" | "search";

export type ItinerarySource = AnalyticsSource;

export type SharePlanMethod = "copy_link" | "native_share";

export type AnalyticsEventParamsMap = {
  [AnalyticsEvents.signUp]: {
    entry_point: AnalyticsEntryPoint;
    method: "google";
  };
  [AnalyticsEvents.login]: {
    entry_point: AnalyticsEntryPoint;
    method: "google";
  };
  [AnalyticsEvents.createBookmarkFolder]: undefined;
  [AnalyticsEvents.addToBookmark]: {
    place_category?: string;
    source?: AnalyticsSource;
  };
  [AnalyticsEvents.createPlan]: {
    entry_point: AnalyticsEntryPoint;
    trip_days_bucket?: TripDaysBucket;
  };
  [AnalyticsEvents.viewPlan]: {
    member_count_bucket: MemberCountBucket;
    role?: AnalyticsRoomRole;
  };
  [AnalyticsEvents.inviteView]: {
    entry_point: AnalyticsEntryPoint;
  };
  [AnalyticsEvents.joinPlan]: {
    member_count_bucket?: MemberCountBucket;
    role?: AnalyticsRoomRole;
  };
  [AnalyticsEvents.viewPlace]: {
    place_category?: string;
    rank_bucket?: SearchRankBucket;
    source?: AnalyticsSource;
  };
  [AnalyticsEvents.addToItinerary]: {
    item_count_bucket: ItemCountBucket;
    place_category?: string;
    source: AnalyticsSource;
  };
  [AnalyticsEvents.removeFromItinerary]: {
    item_count_bucket: ItemCountBucket;
  };
  [AnalyticsEvents.reorderItinerary]: {
    item_count_bucket: ItemCountBucket;
    method: "drag_drop";
  };
  [AnalyticsEvents.search]: {
    result_count_bucket: ResultCountBucket;
    search_mode: "map_recenter" | "text";
  };
  [AnalyticsEvents.sharePlan]: {
    member_count_bucket?: MemberCountBucket;
    method: SharePlanMethod;
    role?: AnalyticsRoomRole;
  };
  [AnalyticsEvents.chatMessageSent]: {
    message_type: "ai" | "place" | "text";
  };
};

type AnalyticsEventName = keyof AnalyticsEventParamsMap;

type AnalyticsEventArguments<EventName extends AnalyticsEventName> =
  AnalyticsEventParamsMap[EventName] extends undefined
    ? [params?: undefined]
    : [params: AnalyticsEventParamsMap[EventName]];

function cleanParams(
  params?: object,
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

export function trackAnalyticsEvent<EventName extends AnalyticsEventName>(
  eventName: EventName,
  ...args: AnalyticsEventArguments<EventName>
): void {
  const params = args[0];
  if (!analyticsRuntime.enabled) return;
  if (readAnalyticsConsentCookie() !== "granted") return;

  const cleaned = cleanParams(params);
  if (Object.keys(cleaned).length > 0) {
    sendAnalyticsCommand("event", eventName, cleaned);
  } else {
    sendAnalyticsCommand("event", eventName);
  }
}
