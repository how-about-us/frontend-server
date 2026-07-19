"use client";

import { useCallback, useSyncExternalStore } from "react";

import { AnalyticsRouteTracker } from "@/components/analytics/AnalyticsRouteTracker";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";
import { GoogleAnalyticsScript } from "@/components/analytics/GoogleAnalyticsScript";
import {
  readAnalyticsConsentCookie,
  writeAnalyticsConsentCookie,
  type AnalyticsConsent,
} from "@/lib/analytics/consent-cookie";

type ConsentState = AnalyticsConsent | "pending";

type ConsentGatedAnalyticsProps = {
  debugMode: boolean;
  gaId: string;
};

const consentListeners = new Set<() => void>();

function subscribeToAnalyticsConsent(listener: () => void): () => void {
  consentListeners.add(listener);
  return () => {
    consentListeners.delete(listener);
  };
}

function getAnalyticsConsentSnapshot(): ConsentState {
  return readAnalyticsConsentCookie() ?? "pending";
}

function getAnalyticsConsentServerSnapshot(): ConsentState {
  return "pending";
}

function notifyAnalyticsConsentChanged(): void {
  consentListeners.forEach((listener) => listener());
}

export function ConsentGatedAnalytics({
  debugMode,
  gaId,
}: ConsentGatedAnalyticsProps) {
  const consent = useSyncExternalStore(
    subscribeToAnalyticsConsent,
    getAnalyticsConsentSnapshot,
    getAnalyticsConsentServerSnapshot,
  );

  const handleAccept = useCallback(() => {
    writeAnalyticsConsentCookie("granted");
    notifyAnalyticsConsentChanged();
  }, []);

  const handleReject = useCallback(() => {
    writeAnalyticsConsentCookie("denied");
    notifyAnalyticsConsentChanged();
  }, []);

  return (
    <>
      {consent === "pending" ? (
        <CookieConsentBanner onAccept={handleAccept} onReject={handleReject} />
      ) : null}
      {consent === "granted" ? (
        <>
          <GoogleAnalyticsScript debugMode={debugMode} gaId={gaId} />
          <AnalyticsRouteTracker />
        </>
      ) : null}
    </>
  );
}
