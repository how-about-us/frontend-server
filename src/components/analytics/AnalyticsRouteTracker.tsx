"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";

type AnalyticsRouteTrackerProps = {
  gaId: string;
};

function AnalyticsRouteTrackerInner({ gaId }: AnalyticsRouteTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    sendGAEvent("config", gaId, { page_path: pagePath });
  }, [gaId, pathname, searchParams]);

  return null;
}

export function AnalyticsRouteTracker({ gaId }: AnalyticsRouteTrackerProps) {
  return (
    <Suspense fallback={null}>
      <AnalyticsRouteTrackerInner gaId={gaId} />
    </Suspense>
  );
}
