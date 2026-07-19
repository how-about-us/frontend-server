"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";

import { analyticsPagePath } from "@/lib/analytics/context";

type AnalyticsRouteTrackerProps = {
  gaId: string;
};

export function AnalyticsRouteTracker({ gaId }: AnalyticsRouteTrackerProps) {
  const pathname = usePathname();

  useEffect(() => {
    sendGAEvent("config", gaId, { page_path: analyticsPagePath(pathname) });
  }, [gaId, pathname]);

  return null;
}
