"use client";

import { useCallback, useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

import { AnalyticsRouteTracker } from "@/components/analytics/AnalyticsRouteTracker";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";
import {
  readAnalyticsConsentCookie,
  writeAnalyticsConsentCookie,
  type AnalyticsConsent,
} from "@/lib/analytics/consent-cookie";

type ConsentState = AnalyticsConsent | "pending";

type ConsentGatedAnalyticsProps = {
  gaId: string;
};

const shouldLoadAnalyticsScripts =
  process.env.NODE_ENV === "production" && Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

export function ConsentGatedAnalytics({ gaId }: ConsentGatedAnalyticsProps) {
  const [consent, setConsent] = useState<ConsentState>("pending");

  useEffect(() => {
    setConsent(readAnalyticsConsentCookie() ?? "pending");
  }, []);

  const handleAccept = useCallback(() => {
    writeAnalyticsConsentCookie("granted");
    setConsent("granted");
  }, []);

  const handleReject = useCallback(() => {
    writeAnalyticsConsentCookie("denied");
    setConsent("denied");
  }, []);

  return (
    <>
      {consent === "pending" ? (
        <CookieConsentBanner onAccept={handleAccept} onReject={handleReject} />
      ) : null}
      {consent === "granted" && shouldLoadAnalyticsScripts ? (
        <>
          <GoogleAnalytics gaId={gaId} />
          <AnalyticsRouteTracker gaId={gaId} />
        </>
      ) : null}
    </>
  );
}
