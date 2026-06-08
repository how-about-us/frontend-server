import { sendGAEvent } from "@next/third-parties/google";

import { readAnalyticsConsentCookie } from "@/lib/analytics/consent-cookie";

const shouldTrackAnalytics =
  process.env.NODE_ENV === "production" &&
  Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

export const AnalyticsEvents = {
  login: "login",
  createBookmarkFolder: "create_bookmark_folder",
  addToBookmark: "add_to_bookmark",
  createPlan: "create_plan",
  addToItinerary: "add_to_itinerary",
  search: "search",
  sharePlan: "share_plan",
} as const;

export type ItinerarySource = "bookmark" | "search";

export type SharePlanMethod = "copy_link" | "kakao";

export type AnalyticsEventParams = {
  method?: "google" | SharePlanMethod;
  place_id?: string;
  place_name?: string;
  source?: ItinerarySource;
  search_term?: string;
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
