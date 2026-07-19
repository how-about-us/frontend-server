import type { AnalyticsPageViewParams } from "@/lib/analytics/context";

type GoogleAnalyticsConfig = {
  debug_mode?: true;
  send_page_view: false;
};

type GoogleTag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GoogleTag;
  }
}

let initializedConfiguration: string | null = null;

export function buildGoogleAnalyticsConfig(
  debugMode: boolean,
): GoogleAnalyticsConfig {
  return {
    send_page_view: false,
    ...(debugMode ? { debug_mode: true } : {}),
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

export function trackAnalyticsPageView(
  params: AnalyticsPageViewParams,
): void {
  sendAnalyticsCommand("event", "page_view", params);
}
