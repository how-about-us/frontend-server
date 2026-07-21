import type { AnalyticsPageViewParams } from "@/lib/analytics/context";
import { analyticsConsentStore } from "@/lib/analytics/consent-store";
import { analyticsRuntime } from "@/lib/analytics/runtime";

type GoogleAnalyticsConfig = {
  debug_mode?: true;
  send_page_view: false;
};

type GoogleTag = (...args: unknown[]) => void;

type GoogleConsentValue = "granted" | "denied";

type GoogleAnalyticsConsentState = {
  ad_personalization: "denied";
  ad_storage: "denied";
  ad_user_data: "denied";
  analytics_storage: GoogleConsentValue;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GoogleTag;
  }
}

let initializedConfiguration: string | null = null;
let consentDefaultSent = false;

export function buildGoogleAnalyticsConfig(
  debugMode: boolean,
): GoogleAnalyticsConfig {
  return {
    send_page_view: false,
    ...(debugMode ? { debug_mode: true } : {}),
  };
}

export function buildGoogleAnalyticsConsentState(
  analyticsStorage: GoogleConsentValue,
): GoogleAnalyticsConsentState {
  return {
    ad_personalization: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    analytics_storage: analyticsStorage,
  };
}

function ensureGoogleTag(): GoogleTag | null {
  if (typeof window === "undefined") return null;

  window.dataLayer ??= [];
  window.gtag ??= (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
  return window.gtag;
}

export function sendAnalyticsCommand(...args: unknown[]): void {
  ensureGoogleTag()?.(...args);
}

export function initializeGoogleAnalytics(
  measurementId: string,
  debugMode: boolean,
): void {
  if (!consentDefaultSent) {
    sendAnalyticsCommand(
      "consent",
      "default",
      buildGoogleAnalyticsConsentState("denied"),
    );
    consentDefaultSent = true;
  }

  sendAnalyticsCommand(
    "consent",
    "update",
    buildGoogleAnalyticsConsentState("granted"),
  );

  const configuration = `${measurementId}:${debugMode}`;
  if (initializedConfiguration === configuration) return;

  sendAnalyticsCommand("js", new Date());
  sendAnalyticsCommand(
    "config",
    measurementId,
    buildGoogleAnalyticsConfig(debugMode),
  );
  initializedConfiguration = configuration;
}

export function revokeGoogleAnalyticsConsent(): void {
  if (
    initializedConfiguration === null ||
    typeof window === "undefined" ||
    typeof window.gtag !== "function"
  ) {
    return;
  }

  sendAnalyticsCommand("set", { user_id: null });
  sendAnalyticsCommand(
    "consent",
    "update",
    buildGoogleAnalyticsConsentState("denied"),
  );
}

export function trackAnalyticsPageView(
  params: AnalyticsPageViewParams,
): void {
  if (!analyticsRuntime.enabled) return;
  if (!analyticsConsentStore.isGranted()) return;
  sendAnalyticsCommand("event", "page_view", params);
}
