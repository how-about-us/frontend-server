"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { trackAnalyticsPageView } from "@/lib/analytics/client";
import { buildAnalyticsPageView } from "@/lib/analytics/context";
import { setAnalyticsUserId } from "@/lib/analytics/track";

export function AnonymousAnalyticsRouteTracker() {
  const pathname = usePathname();
  const lastTrackedPathname = useRef<string | null>(null);
  const previousPageLocation = useRef<string | null>(null);

  useEffect(() => {
    if (lastTrackedPathname.current === pathname) return;

    const pageView = buildAnalyticsPageView({
      origin: window.location.origin,
      pathname,
      referrer: previousPageLocation.current ?? document.referrer,
      search: window.location.search,
      title: document.title,
    });

    setAnalyticsUserId(null);
    trackAnalyticsPageView(pageView);
    lastTrackedPathname.current = pathname;
    previousPageLocation.current = pageView.page_location;
  }, [pathname]);

  return null;
}
