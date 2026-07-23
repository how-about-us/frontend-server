"use client";

import type { ReactNode } from "react";
import { useCallback, useSyncExternalStore } from "react";

import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";
import { GoogleAnalyticsScript } from "@/components/analytics/GoogleAnalyticsScript";
import {
  denyAnalyticsConsent,
  grantAnalyticsConsent,
} from "@/lib/analytics/consent-actions";
import { analyticsConsentStore } from "@/lib/analytics/consent-store";

type ConsentGatedAnalyticsProps = {
  children: ReactNode;
  debugMode: boolean;
  gaId: string;
};

export function ConsentGatedAnalytics({
  children,
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
          {children}
        </>
      ) : null}
    </>
  );
}
