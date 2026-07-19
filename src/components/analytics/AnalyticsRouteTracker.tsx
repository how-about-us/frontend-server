"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";

import { analyticsPagePath } from "@/lib/analytics/context";
import { useSessionUser } from "@/hooks/useSessionUser";
import { setAnalyticsUserId } from "@/lib/analytics/track";

type AnalyticsRouteTrackerProps = {
  gaId: string;
};

export function AnalyticsRouteTracker({ gaId }: AnalyticsRouteTrackerProps) {
  const pathname = usePathname();
  const { data: user } = useSessionUser();
  const userId = user?.id;

  useEffect(() => {
    setAnalyticsUserId(userId);
  }, [userId]);


  useEffect(() => {
    sendGAEvent("config", gaId, { page_path: analyticsPagePath(pathname) });
  }, [gaId, pathname]);

  return null;
}
