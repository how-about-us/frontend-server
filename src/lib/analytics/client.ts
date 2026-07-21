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
let analyticsTransportReady = false;
const pendingAnalyticsCommands: unknown[][] = [];

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
  if (!analyticsTransportReady) {
    pendingAnalyticsCommands.push(args);
    return;
  }

  ensureGoogleTag()?.(...args);
}

function sendInitializationCommand(...args: unknown[]): void {
  ensureGoogleTag()?.(...args);
}

function openAnalyticsTransport(): void {
  analyticsTransportReady = true;
  for (const command of pendingAnalyticsCommands.splice(0)) {
    sendAnalyticsCommand(...command);
  }
}

export function initializeGoogleAnalytics(
  measurementId: string,
  debugMode: boolean,
): void {
  if (!consentDefaultSent) {
    sendInitializationCommand(
      "consent",
      "default",
      buildGoogleAnalyticsConsentState("denied"),
    );
    consentDefaultSent = true;
  }

  sendInitializationCommand(
    "consent",
    "update",
    buildGoogleAnalyticsConsentState("granted"),
  );

  const configuration = `${measurementId}:${debugMode}`;
  if (initializedConfiguration === configuration) {
    openAnalyticsTransport();
    return;
  }

  sendInitializationCommand("js", new Date());
  sendInitializationCommand(
    "config",
    measurementId,
    buildGoogleAnalyticsConfig(debugMode),
  );
  initializedConfiguration = configuration;
  openAnalyticsTransport();
}

export function revokeGoogleAnalyticsConsent(): void {
  analyticsTransportReady = false;
  pendingAnalyticsCommands.length = 0;

  if (
    initializedConfiguration === null ||
    typeof window === "undefined" ||
    typeof window.gtag !== "function"
  ) {
    return;
  }

  sendInitializationCommand("set", { user_id: null });
  sendInitializationCommand(
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
