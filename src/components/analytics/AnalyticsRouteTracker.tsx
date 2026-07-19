"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useSessionUser } from "@/hooks/useSessionUser";
import { trackAnalyticsPageView } from "@/lib/analytics/client";
import { buildAnalyticsPageView } from "@/lib/analytics/context";
import { setAnalyticsUserId } from "@/lib/analytics/track";

export function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const { data: user } = useSessionUser();
  const userId = user?.id;
  const lastTrackedPathname = useRef<string | null>(null);
  const previousPageLocation = useRef<string | null>(null);

  useEffect(() => {
    setAnalyticsUserId(userId);
  }, [userId]);

  useEffect(() => {
    if (lastTrackedPathname.current === pathname) return;

    const pageView = buildAnalyticsPageView({
      origin: window.location.origin,
      pathname,
      referrer: previousPageLocation.current ?? document.referrer,
      title: document.title,
    });
    trackAnalyticsPageView(pageView);
    lastTrackedPathname.current = pathname;
    previousPageLocation.current = pageView.page_location;
  }, [pathname]);

  return null;
}
