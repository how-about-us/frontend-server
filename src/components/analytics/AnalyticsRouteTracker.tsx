"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useSessionUser } from "@/hooks/useSessionUser";
import { trackAnalyticsPageView } from "@/lib/analytics/client";
import {
  buildSessionPageViewPlan,
  executeSessionPageViewPlan,
} from "@/lib/analytics/page-view-session";
import { setAnalyticsUserId } from "@/lib/analytics/track";
import { shouldSkipReconcileClientSession } from "@/lib/auth-session";
import { useSessionStore } from "@/stores/session-store";

export function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const sessionReady = useSessionStore((state) => state.sessionReady);
  const { data: user, status: queryStatus } = useSessionUser();
  const userId = user?.id;
  const lastTrackedPathname = useRef<string | null>(null);
  const previousPageLocation = useRef<string | null>(null);

  useEffect(() => {
    const plan = buildSessionPageViewPlan({
      origin: window.location.origin,
      pathname,
      referrer: previousPageLocation.current ?? document.referrer,
      title: document.title,
      lastTrackedPathname: lastTrackedPathname.current,
      queryStatus,
      // SessionReconciler의 layout effect가 같은 commit에서 갱신한 값을 읽는다.
      sessionReady: useSessionStore.getState().sessionReady,
      skipSessionReconciliation:
        shouldSkipReconcileClientSession(pathname),
      userId,
    });

    if (!plan) return;

    executeSessionPageViewPlan(plan, {
      setUserId: setAnalyticsUserId,
      trackPageView: trackAnalyticsPageView,
    });

    if (!plan.pageView) return;
    lastTrackedPathname.current = pathname;
    previousPageLocation.current = plan.pageView.page_location;
  }, [pathname, queryStatus, sessionReady, userId]);

  return null;
}
