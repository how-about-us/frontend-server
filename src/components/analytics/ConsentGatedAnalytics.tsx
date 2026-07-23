"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  AnalyticsRouteTracker,
  AnonymousAnalyticsRouteTracker,
} from "@/components/analytics/AnalyticsRouteTracker";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";
import { GoogleAnalyticsScript } from "@/components/analytics/GoogleAnalyticsScript";
import {
  denyAnalyticsConsent,
  grantAnalyticsConsent,
} from "@/lib/analytics/consent-actions";
import { analyticsConsentStore } from "@/lib/analytics/consent-store";

type ConsentGatedAnalyticsProps = {
  anonymous?: boolean;
  debugMode: boolean;
  gaId: string;
};

export function ConsentGatedAnalytics({
  anonymous = false,
  debugMode,
  gaId,
}: ConsentGatedAnalyticsProps) {
  const consent = useSyncExternalStore(
    analyticsConsentStore.subscribe,
    analyticsConsentStore.getSnapshot,
    analyticsConsentStore.getServerSnapshot,
  );

  const handleAccept = useCallback(() => {
    grantAnalyticsConsent();
  }, []);

  const handleReject = useCallback(() => {
    denyAnalyticsConsent();
  }, []);

  return (
    <>
      {consent === "pending" ? (
        <CookieConsentBanner onAccept={handleAccept} onReject={handleReject} />
      ) : null}
      {consent === "granted" ? (
        <>
          <GoogleAnalyticsScript debugMode={debugMode} gaId={gaId} />
          {anonymous ? (
            <AnonymousAnalyticsRouteTracker />
          ) : (
            <AnalyticsRouteTracker />
          )}
        </>
      ) : null}
    </>
  );
}
